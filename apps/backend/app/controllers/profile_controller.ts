import { inject } from '@adonisjs/core'
import AvatarService from '#services/avatar_service'
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
  constructor(protected avatarService: AvatarService) {}

  async show({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }

  async update({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(updateProfileValidator, {
      meta: { userId: user.id },
    })

    user.merge(data)
    await user.save()
    return serialize(UserTransformer.transform(user))
  }

  async updateStatus({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { status } = await request.validateUsing(updateStatusValidator)

    user.status = status
    await user.save()
    return serialize(UserTransformer.transform(user))
  }

  async updateAvatar({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { avatar } = await request.validateUsing(updateAvatarValidator)

    await this.avatarService.save(user, avatar)
    return serialize(UserTransformer.transform(user))
  }

  async destroyAvatar({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    await this.avatarService.remove(user)
    return serialize(UserTransformer.transform(user))
  }
}
