import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

// The minimal public shape of a user, embedded wherever another resource
// points to one (channel creator, later message authors and members).
// UserTransformer stays for the profile, which also has private fields.
export default class UserSummaryTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, ['id', 'nickname'])
  }
}
