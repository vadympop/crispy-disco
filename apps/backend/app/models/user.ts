import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { beforeCreate, manyToMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import Channel from '#models/channel'
import Message from '#models/message'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static selfAssignPrimaryKey = true
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }

  @manyToMany(() => Channel, {
    pivotTable: 'channel_members',
    pivotColumns: ['status'],
    pivotTimestamps: true,
  })
  declare channels: ManyToMany<typeof Channel>

  /**
   * Messages in which this user was mentioned with @nickname
   */
  @manyToMany(() => Message, {
    pivotTable: 'message_mentions',
  })
  declare mentionedIn: ManyToMany<typeof Message>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
