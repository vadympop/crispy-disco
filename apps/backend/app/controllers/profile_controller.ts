import { inject } from '@adonisjs/core'
import UserService from '#services/user_service'
import UserTransformer from '#transformers/user_transformer'
import {
  updateAvatarValidator,
  updateProfileValidator,
  updateStatusValidator,
} from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * The logged-in user's own account: /api/v1/account/...
 */
@inject()
export default class ProfileController {
  constructor(protected userService: UserService) {}

  async show({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }

  async update({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(updateProfileValidator, {
      meta: { userId: user.id },
    })

    await this.userService.updateProfile(user, data)
    return serialize(UserTransformer.transform(user))
  }

  async updateStatus({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { status } = await request.validateUsing(updateStatusValidator)

    await this.userService.setStatus(user, status)
    return serialize(UserTransformer.transform(user))
  }

  async updateAvatar({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { avatar } = await request.validateUsing(updateAvatarValidator)

    await this.userService.setAvatar(user, avatar)
    return serialize(UserTransformer.transform(user))
  }

  async destroyAvatar({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    await this.userService.removeAvatar(user)
    return serialize(UserTransformer.transform(user))
  }
}
