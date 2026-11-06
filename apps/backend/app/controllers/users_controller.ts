import User from '#models/user'
import PublicProfileTransformer from '#transformers/public_profile_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async show({ params, serialize }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return serialize(PublicProfileTransformer.transform(user))
  }
}
