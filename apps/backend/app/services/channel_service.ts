import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import Channel from '#models/channel'
import type User from '#models/user'

export const CHANNEL_EXPIRY_DAYS = 30

type MemberStatus = 'member' | 'invited' | 'banned'

export default class ChannelService {

  async listFor(user: User) {
    return user.related('channels').query().whereNotPivot('status', 'banned').preload('creator')
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
        throw new Exception(`You are banned from #${name}`, { status: 403, code: 'E_CHANNEL_BANNED' })
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

    if (this.isAdmin(user, channel)) {
      await channel.delete()
      return { channelDeleted: true }
    }

    await channel.related('members').detach([user.id])
    return { channelDeleted: false }
  }


  async quit(user: User, name: string) {
    const channel = await this.findByNameOrFail(name)

    if (!this.isAdmin(user, channel)) {
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
    return user
      .related('channels')
      .query()
      .where('channels.id', channelId)
      .preload('creator')
      .firstOrFail()
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
