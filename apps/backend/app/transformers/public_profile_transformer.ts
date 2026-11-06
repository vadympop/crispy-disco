import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

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
