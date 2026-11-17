import vine from '@vinejs/vine'

export const MAX_PAGE_SIZE = 100
export const MAX_MESSAGE_LENGTH = 2000

export const messageHistoryValidator = vine.create({
  before: vine.string().optional(),
  after: vine.string().optional(),
  limit: vine.number().withoutDecimals().range([1, MAX_PAGE_SIZE]).optional(),
})

export const sendMessageValidator = vine.create({
  content: vine.string().trim().minLength(1).maxLength(MAX_MESSAGE_LENGTH),
})

export const editMessageValidator = sendMessageValidator

/**
 * The fixed set of reactions. The database stores the key, the frontend
 * shows the matching emoji.
 */
export const REACTIONS = ['thumbs_up', 'heart', 'laugh', 'wow', 'sad'] as const
export type Reaction = (typeof REACTIONS)[number]

// request.validateUsing() also passes the route params under `params`
// https://docs.adonisjs.com/guides/basics/validation#validating-cookies-headers-and-route-params
export const reactionValidator = vine.create({
  params: vine.object({
    reaction: vine.enum(REACTIONS),
  }),
})
