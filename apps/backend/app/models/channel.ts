import { ChannelSchema } from '#database/schema'
import { beforeCreate, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class Channel extends ChannelSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(channel: Channel) {
    channel.id = randomUUID()
  }

  // a private chat between exactly two users
  get isDirect() {
    return this.type === 'direct'
  }

  @belongsTo(() => User, { foreignKey: 'creatorId' })
  declare creator: BelongsTo<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'channel_members',
    pivotColumns: ['status'],
    pivotTimestamps: true,
  })
  declare members: ManyToMany<typeof User>
}
