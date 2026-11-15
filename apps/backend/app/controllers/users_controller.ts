import { inject } from '@adonisjs/core'
import User from '#models/user'
import AvatarService from '#services/avatar_service'
import UserService from '#services/user_service'
import ChannelSummaryTransformer from '#transformers/channel_summary_transformer'
import PublicProfileTransformer from '#transformers/public_profile_transformer'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class UsersController {
  constructor(
    protected userService: UserService,
    protected avatarService: AvatarService
  ) {}

  async show({ params, serialize }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return serialize(PublicProfileTransformer.transform(user))
  }

  // https://docs.adonisjs.com/guides/basics/response#streaming-files
  async avatar({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    if (!user.avatarUpdatedAt) {
      return response.notFound({ message: 'This user has no profile picture' })
    }

    // the url changes with every upload, so the file can be cached for long
    response.header('Cache-Control', 'public, max-age=31536000, immutable')
    return response.download(this.avatarService.pathOf(user.id))
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
