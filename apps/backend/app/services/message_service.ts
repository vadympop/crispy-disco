import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import type Channel from '#models/channel'
import Message from '#models/message'
import type User from '#models/user'
import ChannelService from '#services/channel_service'

export const DEFAULT_PAGE_SIZE = 50

const MENTION_PATTERN = /@([a-zA-Z0-9_.-]{3,30})/g

export type MessageCursor = { before?: string; after?: string; limit?: number }

@inject()
export default class MessageService {
  constructor(protected channelService: ChannelService) {}

  async list(user: User, channelId: string, cursor: MessageCursor = {}) {
    const channel = await this.channelService.findOrFail(channelId)
    await this.channelService.ensureMember(user, channel)

    const limit = cursor.limit ?? DEFAULT_PAGE_SIZE
    const forward = cursor.after !== undefined
    const query = Message.query()
      .where('channel_id', channel.id)
      .whereNull('deleted_at')
      .preload('author')

    const cursorId = cursor.after ?? cursor.before
    if (cursorId !== undefined) {
      await this.findInChannel(channel, cursorId)

      const cursorTime = db.from('messages').select('created_at').where('id', cursorId)
      const op = forward ? '>' : '<'
      query.where((q) => {
        q.where('created_at', op, cursorTime).orWhere((tie) => {
          tie.where('created_at', cursorTime).where('id', op, cursorId)
        })
      })
    }

    const direction = forward ? 'asc' : 'desc'
    const rows = await query
      .orderBy('created_at', direction)
      .orderBy('id', direction)
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const messages = rows.slice(0, limit)
    if (!forward) {
      messages.reverse()
    }

    return { messages, hasMore }
  }

  async send(user: User, channelId: string, content: string) {
    const channel = await this.channelService.findOrFail(channelId)
    await this.channelService.ensureMember(user, channel)

    const message = await db.transaction(async (trx) => {
      channel.useTransaction(trx)

      const created = await Message.create(
        { channelId: channel.id, authorId: user.id, content },
        { client: trx }
      )

      const mentioned = await this.findMentionedMembers(channel, content)
      if (mentioned.length > 0) {
        await created.related('mentions').attach(mentioned, trx)
      }

      await this.channelService.touch(channel)
      return created
    })

    await message.load('author')
    // TODO(realtime): emit message:new to the channel room
    return message
  }

  private async findInChannel(channel: Channel, messageId: string) {
    const message = await Message.query()
      .where('id', messageId)
      .where('channel_id', channel.id)
      .first()
    if (!message) {
      throw new Exception('That message does not exist in this channel', {
        status: 404,
        code: 'E_MESSAGE_NOT_FOUND',
      })
    }
    return message
  }

  private async findMentionedMembers(channel: Channel, content: string) {
    const nicknames = new Set<string>()
    for (const [, nickname] of content.matchAll(MENTION_PATTERN)) {
      // the pattern always captures, but the frontend's strict config doesn't know that
      if (!nickname) continue
      nicknames.add(nickname)
      nicknames.add(nickname.replace(/\.+$/, ''))
    }
    if (nicknames.size === 0) {
      return []
    }

    const users = await channel
      .related('members')
      .query()
      .wherePivot('status', 'member')
      .whereIn('nickname', [...nicknames])
      .select('users.id')

    return users.map((member) => member.id)
  }
}
