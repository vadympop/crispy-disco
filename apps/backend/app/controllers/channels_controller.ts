import type { HttpContext } from '@adonisjs/core/http'
import ChannelTransformer from '#transformers/channel_transformer'

export default class ChannelsController {
  /**
   * Channels the logged-in user is a member of or invited to
   */
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    const channels = await user
      .related('channels')
      .query()
      .whereNotPivot('status', 'banned')
      .preload('creator')

    return serialize(ChannelTransformer.transform(channels))
  }
}
