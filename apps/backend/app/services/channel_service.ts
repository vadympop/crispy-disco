import { createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import Channel from '#models/channel'
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

  // Opens the direct chat with the user `partnerId`, creating it the first time
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

  async cancel(user: User, name: string) {
    const channel = await this.findByNameOrFail(name)
    const status = await this.statusOf(user, channel)

    if (status !== 'member') {
      throw new Exception(`You are not a member of #${name}`, {
        status: 404,
        code: 'E_NOT_A_MEMBER',
      })
    }

    // a direct chat can't continue with one person, so leaving deletes it
    if (this.isAdmin(user, channel) || channel.isDirect) {
      await channel.delete()
      return { channelDeleted: true }
    }

    await channel.related('members').detach([user.id])
    return { channelDeleted: false }
  }

  async quit(user: User, name: string) {
    const channel = await this.findByNameOrFail(name)

    // in a direct chat both people can delete it
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

  async decline(user: User, name: string) {
    const channel = await this.findByNameOrFail(name)
    const status = await this.statusOf(user, channel)

    if (status !== 'invited') {
      throw new Exception(`You have no invite to #${name}`, {
        status: 404,
        code: 'E_NO_INVITE',
      })
    }

    await channel.related('members').detach([user.id])
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

  private async findByNameOrFail(name: string) {
    const channel = await Channel.findBy('name', name)
    if (!channel) {
      throw new Exception(`Channel #${name} does not exist`, {
        status: 404,
        code: 'E_CHANNEL_NOT_FOUND',
      })
    }
    return channel
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
