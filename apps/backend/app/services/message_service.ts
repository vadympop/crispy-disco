import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import type Channel from '#models/channel'
import Message from '#models/message'
import type User from '#models/user'
import ChannelService from '#services/channel_service'
import { decodeCursor } from '#services/message_cursor'

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

    const cursorValue = cursor.after ?? cursor.before
    if (cursorValue !== undefined) {
      const position = decodeCursor(cursorValue)
      if (!position) {
        throw new Exception('That cursor is not valid', {
          status: 422,
          code: 'E_INVALID_CURSOR',
        })
      }

      const op = forward ? '>' : '<'
      query.where((q) => {
        q.where('created_at', op, position.createdAt).orWhere((tie) => {
          tie.where('created_at', position.createdAt).where('id', op, position.id)
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

  async edit(user: User, channelId: string, messageId: string, content: string) {
    const channel = await this.channelService.findOrFail(channelId)
    await this.channelService.ensureMember(user, channel)

    const message = await this.findVisible(channel, messageId)
    if (message.authorId !== user.id) {
      throw new Exception('You can only edit your own messages', {
        status: 403,
        code: 'E_NOT_MESSAGE_AUTHOR',
      })
    }

    await db.transaction(async (trx) => {
      channel.useTransaction(trx)
      message.useTransaction(trx)

      message.content = content
      message.editedAt = DateTime.now()
      await message.save()

      const mentioned = await this.findMentionedMembers(channel, content)
      await message.related('mentions').sync(mentioned, true, trx)
    })

    await message.load('author')
    // TODO(realtime): emit message:updated to the channel room
    return message
  }

  async delete(user: User, channelId: string, messageId: string) {
    const channel = await this.channelService.findOrFail(channelId)
    await this.channelService.ensureMember(user, channel)

    const message = await this.findVisible(channel, messageId)
    if (message.authorId !== user.id && !this.channelService.isAdmin(user, channel)) {
      throw new Exception('You can only delete your own messages', {
        status: 403,
        code: 'E_NOT_MESSAGE_AUTHOR',
      })
    }

    message.deletedAt = DateTime.now()
    await message.save()
    // TODO(realtime): emit message:deleted to the channel room
  }

  private async findVisible(channel: Channel, messageId: string) {
    const message = await Message.query()
      .where('id', messageId)
      .where('channel_id', channel.id)
      .whereNull('deleted_at')
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
