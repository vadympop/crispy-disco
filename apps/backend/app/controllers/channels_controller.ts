import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ChannelService from '#services/channel_service'
import ChannelTransformer from '#transformers/channel_transformer'
import PublicProfileTransformer from '#transformers/public_profile_transformer'
import {
  joinChannelValidator,
  moderationTargetValidator,
  startDirectValidator,
} from '#validators/channel'

@inject()
export default class ChannelsController {
  constructor(protected channelService: ChannelService) {}

  async index({ auth, serialize }: HttpContext) {
    const channels = await this.channelService.listFor(auth.getUserOrFail())
    return serialize(ChannelTransformer.transform(channels))
  }

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

  async direct({ auth, request, serialize }: HttpContext) {
    const { userId } = await request.validateUsing(startDirectValidator)
    const channel = await this.channelService.startDirect(auth.getUserOrFail(), userId)
    return serialize(ChannelTransformer.transform(channel))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const channel = await this.channelService.findOne(auth.getUserOrFail(), params.id)
    return serialize(ChannelTransformer.transform(channel))
  }

  async members({ auth, params, serialize }: HttpContext) {
    const members = await this.channelService.membersOf(auth.getUserOrFail(), params.id)
    return serialize(PublicProfileTransformer.transform(members))
  }

  async cancel({ auth, params }: HttpContext) {
    return this.channelService.cancel(auth.getUserOrFail(), params.id)
  }

  async destroy({ auth, params, response }: HttpContext) {
    await this.channelService.quit(auth.getUserOrFail(), params.id)
    return response.noContent()
  }

  async decline({ auth, params, response }: HttpContext) {
    await this.channelService.decline(auth.getUserOrFail(), params.id)
    return response.noContent()
  }

  async invite({ auth, params, request, serialize }: HttpContext) {
    const { nickname } = await request.validateUsing(moderationTargetValidator)
    return serialize(await this.channelService.invite(auth.getUserOrFail(), params.id, nickname))
  }

  async revoke({ auth, params, request, response }: HttpContext) {
    const { nickname } = await request.validateUsing(moderationTargetValidator)
    await this.channelService.revoke(auth.getUserOrFail(), params.id, nickname)
    return response.noContent()
  }

  async kick({ auth, params, request, serialize }: HttpContext) {
    const { nickname } = await request.validateUsing(moderationTargetValidator)
    return serialize(await this.channelService.kick(auth.getUserOrFail(), params.id, nickname))
  }
}
