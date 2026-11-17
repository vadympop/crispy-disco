import { MessageReactionSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import Message from '#models/message'
import User from '#models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class MessageReaction extends MessageReactionSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(reaction: MessageReaction) {
    reaction.id = randomUUID()
  }

  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>

  /**
   * The user who reacted
   */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
