import { ChannelSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class Channel extends ChannelSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }

  @belongsTo(() => User)
  declare creator: BelongsTo<typeof User>
}
