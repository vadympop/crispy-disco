import { createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Channel from '#models/channel'
import KickVote from '#models/kick_vote'
import User from '#models/user'

export const CHANNEL_EXPIRY_DAYS = 30

type MemberStatus = 'member' | 'invited' | 'banned'

export default class ChannelService {
  async listFor(user: User) {
    const channels = await user
      .related('channels')
      .query()
      .whereNotPivot('status', 'banned')
      .preload('creator')
    await this.loadDirectMembers(channels)
    return channels
  }

  async startDirect(user: User, partnerId: string) {
    const partner = await User.find(partnerId)
    if (!partner) {
      throw new Exception('That user does not exist', {
        status: 404,
        code: 'E_USER_NOT_FOUND',
      })
    }
    if (partner.id === user.id) {
      throw new Exception("You can't start a chat with yourself", {
        status: 422,
        code: 'E_DIRECT_WITH_SELF',
      })
    }

    const name = directChannelName(user.id, partner.id)
    const channelId = await db.transaction(async (trx) => {
      const existing = await Channel.query({ client: trx }).where('name', name).forUpdate().first()
      if (existing) {
        return existing.id
      }

      const channel = await Channel.create(
        {
          name,
          type: 'direct',
          creatorId: user.id,
          lastActivityAt: DateTime.now(),
        },
        { client: trx }
      )
      await channel
        .related('members')
        .attach({ [user.id]: { status: 'member' }, [partner.id]: { status: 'member' } }, trx)
      return channel.id
    })

    return this.findForUser(user, channelId)
  }

  async join(user: User, name: string, isPrivate = false) {
    const { channelId, created } = await db.transaction(async (trx) => {
      const channel = await Channel.query({ client: trx }).where('name', name).forUpdate().first()

      if (!channel) {
        const newChannel = await Channel.create(
          {
            name,
            type: isPrivate ? 'private' : 'public',
            creatorId: user.id,
            lastActivityAt: DateTime.now(),
          },
          { client: trx }
        )
        await newChannel.related('members').attach({ [user.id]: { status: 'member' } }, trx)
        return { channelId: newChannel.id, created: true }
      }

      const status = await this.statusOf(user, channel)

      if (status === 'banned') {
        throw new Exception(`You are banned from #${name}`, {
          status: 403,
          code: 'E_CHANNEL_BANNED',
        })
      }

      if (status === 'invited') {
        await this.setStatus(user, channel, 'member')
      } else if (status === null) {
        if (channel.type === 'private') {
          throw new Exception(`#${name} is private, you need an invite`, {
            status: 403,
            code: 'E_CHANNEL_PRIVATE',
          })
        }
        await channel.related('members').attach({ [user.id]: { status: 'member' } }, trx)
      }

      return { channelId: channel.id, created: false }
    })

    return { channel: await this.findForUser(user, channelId), created }
  }

  async findOne(user: User, channelId: string) {
    const channel = await user
      .related('channels')
      .query()
      .where('channels.id', channelId)
      .whereNotPivot('status', 'banned')
      .preload('creator')
      .first()

    if (!channel) {
      throw new Exception('That channel does not exist', {
        status: 404,
        code: 'E_CHANNEL_NOT_FOUND',
      })
    }

    await this.loadDirectMembers([channel])
    return channel
  }

  async membersOf(user: User, channelId: string) {
    const channel = await this.findOrFail(channelId)

    if ((await this.statusOf(user, channel)) !== 'member') {
      throw new Exception(`You are not a member of #${channel.name}`, {
        status: 403,
        code: 'E_NOT_A_MEMBER',
      })
    }

    return channel.related('members').query().wherePivot('status', 'member').orderBy('nickname')
  }

  async cancel(user: User, channelId: string) {
    const channel = await this.findOrFail(channelId)
    const status = await this.statusOf(user, channel)

    if (status !== 'member') {
      throw new Exception(`You are not a member of #${channel.name}`, {
        status: 404,
        code: 'E_NOT_A_MEMBER',
      })
    }

    // leaving direct chat deletes it
    if (this.isAdmin(user, channel) || channel.isDirect) {
      await channel.delete()
      return { channelDeleted: true }
    }

    await channel.related('members').detach([user.id])
    return { channelDeleted: false }
  }

  async quit(user: User, channelId: string) {
    const channel = await this.findOrFail(channelId)

    const canDelete =
      this.isAdmin(user, channel) ||
      (channel.isDirect && (await this.statusOf(user, channel)) === 'member')
    if (!canDelete) {
      throw new Exception('Only the admin can close the channel', {
        status: 403,
        code: 'E_NOT_CHANNEL_ADMIN',
      })
    }

    await channel.delete()
  }

  async decline(user: User, channelId: string) {
    const channel = await this.findOrFail(channelId)
    const status = await this.statusOf(user, channel)

    if (status !== 'invited') {
      throw new Exception(`You have no invite to #${channel.name}`, {
        status: 404,
        code: 'E_NO_INVITE',
      })
    }

    await channel.related('members').detach([user.id])
  }

  /**
   * /invite nickname. In a private channel only the admin can invite, in a
   * public one any member. The admin can also invite a banned user, which
   * lifts the ban and clears the old kick votes.
   */
  async invite(user: User, channelId: string, nickname: string) {
    return db.transaction(async (trx) => {
      const channel = await this.lockOrFail(channelId, trx)
      await this.ensureMember(user, channel)

      if (channel.isDirect) {
        throw new Exception("You can't invite anyone to a direct chat", {
          status: 422,
          code: 'E_DIRECT_CHANNEL',
        })
      }

      const isAdmin = this.isAdmin(user, channel)
      if (channel.type === 'private' && !isAdmin) {
        throw new Exception('Only the admin can invite to a private channel', {
          status: 403,
          code: 'E_NOT_CHANNEL_ADMIN',
        })
      }

      const target = await this.findUserByNickname(nickname, trx)
      const status = await this.statusOf(target, channel)

      if (status === 'member') {
        throw new Exception(`${target.nickname} is already in #${channel.name}`, {
          status: 409,
          code: 'E_ALREADY_MEMBER',
        })
      }
      if (status === 'invited') {
        throw new Exception(`${target.nickname} is already invited to #${channel.name}`, {
          status: 409,
          code: 'E_ALREADY_INVITED',
        })
      }

      if (status === 'banned') {
        if (!isAdmin) {
          throw new Exception(`${target.nickname} is banned, only the admin can invite them`, {
            status: 403,
            code: 'E_USER_BANNED',
          })
        }
        await this.setStatus(target, channel, 'invited')
        // start from zero, so 3 new votes are needed for the next ban
        await KickVote.query({ client: trx })
          .where('channel_id', channel.id)
          .where('target_id', target.id)
          .delete()
        // TODO(realtime): emit channel:invited to the target
        return { status: 'invited' as const, unbanned: true }
      }

      await channel.related('members').attach({ [target.id]: { status: 'invited' } }, trx)
      // TODO(realtime): emit channel:invited to the target
      return { status: 'invited' as const, unbanned: false }
    })
  }

  /**
   * /revoke nickname: the admin of a private channel removes a member or
   * takes back an invite
   */
  async revoke(user: User, channelId: string, nickname: string) {
    await db.transaction(async (trx) => {
      const channel = await this.lockOrFail(channelId, trx)

      if (channel.type !== 'private') {
        throw new Exception('/revoke works only in private channels, use /kick', {
          status: 422,
          code: 'E_NOT_PRIVATE_CHANNEL',
        })
      }
      if (!this.isAdmin(user, channel)) {
        throw new Exception('Only the admin can revoke access', {
          status: 403,
          code: 'E_NOT_CHANNEL_ADMIN',
        })
      }

      const target = await this.findUserByNickname(nickname, trx)
      if (target.id === user.id) {
        throw new Exception("You can't revoke yourself, use /quit", {
          status: 422,
          code: 'E_TARGET_SELF',
        })
      }

      const status = await this.statusOf(target, channel)
      if (status !== 'member' && status !== 'invited') {
        throw new Exception(`${target.nickname} is not in #${channel.name}`, {
          status: 404,
          code: 'E_NOT_A_MEMBER',
        })
      }

      await channel.related('members').detach([target.id], trx)
      // TODO(realtime): emit channel:removed to the target
    })
  }

  async touch(channel: Channel) {
    channel.lastActivityAt = DateTime.now()
    await channel.save()
  }

  async deleteInactive(days = CHANNEL_EXPIRY_DAYS) {
    const cutoff = DateTime.now().minus({ days }).toJSDate()

    const expired = await Channel.query()
      .select('id', 'name')
      .where((query) => {
        query
          .where('last_activity_at', '<', cutoff)
          .orWhere((q) => q.whereNull('last_activity_at').where('created_at', '<', cutoff))
      })

    if (expired.length === 0) {
      return []
    }

    await Channel.query()
      .whereIn(
        'id',
        expired.map((channel) => channel.id)
      )
      .delete()

    return expired.map((channel) => channel.name)
  }

  isAdmin(user: User, channel: Channel) {
    return channel.creatorId === user.id
  }

  private async findOrFail(channelId: string) {
    const channel = await Channel.find(channelId)
    if (!channel) {
      throw new Exception('That channel does not exist', {
        status: 404,
        code: 'E_CHANNEL_NOT_FOUND',
      })
    }
    return channel
  }

  // Locks the channel row until the transaction ends, so two moderation
  // commands on the same channel can't interleave
  private async lockOrFail(channelId: string, trx: TransactionClientContract) {
    const channel = await Channel.query({ client: trx }).where('id', channelId).forUpdate().first()
    if (!channel) {
      throw new Exception('That channel does not exist', {
        status: 404,
        code: 'E_CHANNEL_NOT_FOUND',
      })
    }
    return channel
  }

  private async ensureMember(user: User, channel: Channel) {
    if ((await this.statusOf(user, channel)) !== 'member') {
      throw new Exception(`You are not a member of #${channel.name}`, {
        status: 403,
        code: 'E_NOT_A_MEMBER',
      })
    }
  }

  // Commands take the nickname the user typed, the server resolves it
  private async findUserByNickname(nickname: string, trx: TransactionClientContract) {
    const user = await User.query({ client: trx }).where('nickname', nickname).first()
    if (!user) {
      throw new Exception(`There is no user called ${nickname}`, {
        status: 404,
        code: 'E_USER_NOT_FOUND',
      })
    }
    return user
  }

  private async findForUser(user: User, channelId: string) {
    const channel = await user
      .related('channels')
      .query()
      .where('channels.id', channelId)
      .preload('creator')
      .firstOrFail()
    await this.loadDirectMembers([channel])
    return channel
  }

  // The frontend needs the other person of a direct chat. Only direct chats
  // get their members loaded, since a public channel can have many.
  private async loadDirectMembers(channels: Channel[]) {
    for (const channel of channels) {
      if (channel.isDirect) {
        await channel.load('members')
      }
    }
  }

  private async statusOf(user: User, channel: Channel): Promise<MemberStatus | null> {
    const row = await channel.related('members').pivotQuery().where('user_id', user.id).first()
    return row ? (row.status as MemberStatus) : null
  }

  private async setStatus(user: User, channel: Channel, status: MemberStatus) {
    await channel
      .related('members')
      .pivotQuery()
      .where('user_id', user.id)
      .update({ status, updated_at: new Date() })
  }
}

// Both users get the same name, so the unique index prevents a second chat
// between them. It is longer than /join allows (30), so it never clashes
// with a normal channel.
function directChannelName(userId: string, otherId: string) {
  const ids = [userId, otherId].sort().join(':')
  return `dm-${createHash('sha1').update(ids).digest('hex')}`
}
