import vine from '@vinejs/vine'

export const MAX_PAGE_SIZE = 100
export const MAX_MESSAGE_LENGTH = 2000

export const messageHistoryValidator = vine.create({
  before: vine.string().uuid().optional(),
  after: vine.string().uuid().optional(),
  limit: vine.number().withoutDecimals().range([1, MAX_PAGE_SIZE]).optional(),
})

export const sendMessageValidator = vine.create({
  content: vine.string().trim().minLength(1).maxLength(MAX_MESSAGE_LENGTH),
})
