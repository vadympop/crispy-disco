import { BaseTransformer } from '@adonisjs/core/transformers'
import type Message from '#models/message'
import UserSummaryTransformer from '#transformers/user_summary_transformer'
import { encodeCursor } from '#services/message_cursor'

export default class MessageTransformer extends BaseTransformer<Message> {
  toObject() {
    const message = this.resource

    return {
      ...this.pick(message, [
        'id',
        'channelId',
        'content',
        'parentMessageId',
        'createdAt',
        'editedAt',
      ]),
      author: UserSummaryTransformer.transform(message.author),
      cursor: encodeCursor(message),
    }
  }
}
