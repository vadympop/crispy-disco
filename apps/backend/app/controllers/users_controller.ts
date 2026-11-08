import { inject } from '@adonisjs/core'
import User from '#models/user'
import UserService from '#services/user_service'
import ChannelSummaryTransformer from '#transformers/channel_summary_transformer'
import PublicProfileTransformer from '#transformers/public_profile_transformer'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class UsersController {
  constructor(protected userService: UserService) {}

  async show({ params, serialize }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return serialize(PublicProfileTransformer.transform(user))
  }

  async stats({ auth, params, serialize }: HttpContext) {
    const { messageCount, sharedChannels } = await this.userService.statsFor(
      auth.getUserOrFail(),
      params.id
    )
    return serialize({
      messageCount,
      sharedChannels: ChannelSummaryTransformer.transform(sharedChannels),
    })
  }
}
