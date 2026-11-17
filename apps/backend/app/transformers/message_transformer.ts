import { BaseTransformer } from '@adonisjs/core/transformers'
import type Message from '#models/message'
import UserSummaryTransformer from '#transformers/user_summary_transformer'
import { encodeCursor } from '#services/message_cursor'
import { REACTIONS, type Reaction } from '#validators/message'

// Who reacted with one reaction. The same for every viewer, so it can be
// broadcast to the channel; each client checks whether its own id is in it.
export type ReactionGroup = { reaction: Reaction; userIds: string[] }

/**
 * Groups the reaction rows by reaction, in the order of the fixed list,
 * and leaves out the reactions nobody used. Messages whose reactions were
 * not loaded (a message that was just sent) have none.
 */
export function groupReactions(message: Message): ReactionGroup[] {
  const rows = message.reactions ?? []
  return REACTIONS.map((reaction) => ({
    reaction,
    userIds: rows.filter((row) => row.reaction === reaction).map((row) => row.userId),
  })).filter((group) => group.userIds.length > 0)
}

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
      reactions: groupReactions(message),
      cursor: encodeCursor(message),
    }
  }
}
