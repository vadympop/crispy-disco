import vine from '@vinejs/vine'

/**
 * Same rule as the frontend: 2-30 characters, letters, numbers, _ and -
 */
export const channelName = () =>
  vine
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{2,30}$/)

/**
 * /join name [private]
 */
export const joinChannelValidator = vine.create({
  name: channelName(),
  isPrivate: vine.boolean().optional(),
})
