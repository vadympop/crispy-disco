import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MessageService from '#services/message_service'
import MessageTransformer from '#transformers/message_transformer'
import {
  editMessageValidator,
  messageHistoryValidator,
  sendMessageValidator,
} from '#validators/message'

@inject()
export default class MessagesController {
  constructor(protected messageService: MessageService) {}

  async index({ auth, params, request, serialize }: HttpContext) {
    const cursor = await request.validateUsing(messageHistoryValidator)
    const { messages, hasMore } = await this.messageService.list(
      auth.getUserOrFail(),
      params.id,
      cursor
    )

    return serialize({ messages: MessageTransformer.transform(messages).depth(2), hasMore })
  }

  async store({ auth, params, request, response, serialize }: HttpContext) {
    const { content } = await request.validateUsing(sendMessageValidator)
    const message = await this.messageService.send(auth.getUserOrFail(), params.id, content)

    response.status(201)
    return serialize(MessageTransformer.transform(message))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const { content } = await request.validateUsing(editMessageValidator)
    const message = await this.messageService.edit(
      auth.getUserOrFail(),
      params.id,
      params.messageId,
      content
    )
    return serialize(MessageTransformer.transform(message))
  }

  async destroy({ auth, params, response }: HttpContext) {
    await this.messageService.delete(auth.getUserOrFail(), params.id, params.messageId)
    return response.noContent()
  }
}
