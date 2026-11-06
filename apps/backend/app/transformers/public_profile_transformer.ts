import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

// The short profile other users may see (e.g. when clicking a nick).
// No email or settings, those are only in UserTransformer for the owner.
export default class PublicProfileTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'nickname',
      'firstName',
      'lastName',
      'fullName',
      'status',
    ])
  }
}
