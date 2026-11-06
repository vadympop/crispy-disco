import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ChannelService from '#services/channel_service'
import ChannelTransformer from '#transformers/channel_transformer'
import PublicProfileTransformer from '#transformers/public_profile_transformer'
import { joinChannelValidator, startDirectValidator } from '#validators/channel'

@inject()
export default class ChannelsController {
  constructor(protected channelService: ChannelService) {}

  async index({ auth, serialize }: HttpContext) {
    const channels = await this.channelService.listFor(auth.getUserOrFail())
    return serialize(ChannelTransformer.transform(channels))
  }

  // POST /channels/join - join, accept an invite, or create the channel
  async join({ auth, request, response, serialize }: HttpContext) {
    const { name, isPrivate } = await request.validateUsing(joinChannelValidator)
    const { channel, created } = await this.channelService.join(
      auth.getUserOrFail(),
      name,
      isPrivate
    )

    if (created) {
      response.status(201)
    }
    // depth(2): the channel is nested in this object, and its creator one level deeper
    return serialize({ channel: ChannelTransformer.transform(channel).depth(2), created })
  }

  // POST /channels/direct - open the direct chat with a user, creating it the first time
  async direct({ auth, request, serialize }: HttpContext) {
    const { userId } = await request.validateUsing(startDirectValidator)
    const channel = await this.channelService.startDirect(auth.getUserOrFail(), userId)
    return serialize(ChannelTransformer.transform(channel))
  }

  // GET /channels/:id/members - who is in the channel (/list)
  async members({ auth, params, serialize }: HttpContext) {
    const members = await this.channelService.membersOf(auth.getUserOrFail(), params.id)
    return serialize(PublicProfileTransformer.transform(members))
  }

  // POST /channels/:id/cancel - leave; the channel is deleted if the admin leaves
  async cancel({ auth, params }: HttpContext) {
    return this.channelService.cancel(auth.getUserOrFail(), params.id)
  }

  // DELETE /channels/:id - the admin closes the channel
  async destroy({ auth, params, response }: HttpContext) {
    await this.channelService.quit(auth.getUserOrFail(), params.id)
    return response.noContent()
  }

  // POST /channels/:id/decline - refuse an invite
  async decline({ auth, params, response }: HttpContext) {
    await this.channelService.decline(auth.getUserOrFail(), params.id)
    return response.noContent()
  }
}
