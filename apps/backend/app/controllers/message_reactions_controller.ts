import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MessageService from '#services/message_service'
import { reactionValidator } from '#validators/message'

@inject()
export default class MessageReactionsController {
  constructor(protected messageService: MessageService) {}

  async store({ auth, params, request, serialize }: HttpContext) {
    const { params: valid } = await request.validateUsing(reactionValidator)
    const reactions = await this.messageService.react(
      auth.getUserOrFail(),
      params.id,
      params.messageId,
      valid.reaction
    )
    return serialize({ reactions })
  }

  async destroy({ auth, params, request, serialize }: HttpContext) {
    const { params: valid } = await request.validateUsing(reactionValidator)
    const reactions = await this.messageService.unreact(
      auth.getUserOrFail(),
      params.id,
      params.messageId,
      valid.reaction
    )
    return serialize({ reactions })
  }
}
