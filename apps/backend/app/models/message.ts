import { MessageSchema } from '#database/schema'
import { beforeCreate, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Channel from '#models/channel'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class Message extends MessageSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(message: Message) {
    message.id = randomUUID()
  }

  @belongsTo(() => User, {
    foreignKey: 'authorId',
  })
  declare author: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => Message, {
    foreignKey: 'parentMessageId',
  })
  declare parent: BelongsTo<typeof Message>

  /**
   * Users mentioned with @nickname in this message
   */
  @manyToMany(() => User, {
    pivotTable: 'message_mentions',
  })
  declare mentions: ManyToMany<typeof User>
}
