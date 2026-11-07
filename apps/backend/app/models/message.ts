import { MessageSchema } from '#database/schema'
import { beforeCreate, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import encryption from '@adonisjs/core/services/encryption'
import User from '#models/user'
import Channel from '#models/channel'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class Message extends MessageSchema {
  static selfAssignPrimaryKey = true

  /**
   * The text is stored encrypted with APP_KEY (AES-256-GCM, config/encryption.ts),
   * so the database alone does not reveal messages. The model always holds the
   * plain text. A value that can't be decrypted (wrong key, edited row) reads as ''.
   * https://docs.adonisjs.com/guides/security/encryption
   */
  @column({
    prepare: (value: string) => encryption.encrypt(value),
    consume: (value: string) => encryption.decrypt<string>(value) ?? '',
  })
  declare content: string

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
