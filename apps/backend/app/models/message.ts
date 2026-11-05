import { MessageSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Channel from '#models/channel'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class Message extends MessageSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }

  /**
   * A message belongs to a user
   */
  @belongsTo(() => User)
  declare author: BelongsTo<typeof User>

  /**
   * A message belongs to a channel
   */
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>
}
