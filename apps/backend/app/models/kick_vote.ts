import { KickVoteSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Channel from '#models/channel'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class KickVote extends KickVoteSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(kickVote: KickVote) {
    kickVote.id = randomUUID()
  }

  /**
   * The channel the user is being kicked from
   */
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  /**
   * The user being voted out. Both user relations need an explicit
   * foreignKey, otherwise Lucid would guess `userId`
   */
  @belongsTo(() => User, { foreignKey: 'targetId' })
  declare target: BelongsTo<typeof User>

  /**
   * The member who cast the vote
   */
  @belongsTo(() => User, { foreignKey: 'voterId' })
  declare voter: BelongsTo<typeof User>
}
