import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MessageService from '#services/message_service'
import MessageTransformer from '#transformers/message_transformer'
import { reactionValidator } from '#validators/message'

@inject()
export default class MessageReactionsController {
  constructor(protected messageService: MessageService) {}

  // PUT, so adding the same reaction twice changes nothing
  async store({ auth, params, request, serialize }: HttpContext) {
    const { params: valid } = await request.validateUsing(reactionValidator)
    const message = await this.messageService.react(
      auth.getUserOrFail(),
      params.id,
      params.messageId,
      valid.reaction
    )
    return serialize(MessageTransformer.transform(message))
  }

  async destroy({ auth, params, request, serialize }: HttpContext) {
    const { params: valid } = await request.validateUsing(reactionValidator)
    const message = await this.messageService.unreact(
      auth.getUserOrFail(),
      params.id,
      params.messageId,
      valid.reaction
    )
    return serialize(MessageTransformer.transform(message))
  }
}
