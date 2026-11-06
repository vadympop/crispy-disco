import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ChannelService from '#services/channel_service'
import ChannelTransformer from '#transformers/channel_transformer'

@inject()
export default class ChannelsController {
    
  constructor(protected channelService: ChannelService) {}

  async index({ auth, serialize }: HttpContext) {
    const channels = await this.channelService.listFor(auth.getUserOrFail())
    return serialize(ChannelTransformer.transform(channels))
  }
}
