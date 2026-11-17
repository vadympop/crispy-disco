import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MessageService from '#services/message_service'
import { reactionValidator } from '#validators/message'

// Both answer with only the reactions of the message, the same list the
// message:reactions socket event carries
@inject()
export default class MessageReactionsController {
  constructor(protected messageService: MessageService) {}

  // PUT, so adding the same reaction twice changes nothing
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
