import vine from '@vinejs/vine'
import { nickname } from '#validators/user'

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

/**
 * Start a direct chat with another user
 */
export const startDirectValidator = vine.create({
  userId: vine.string().uuid(),
})

/**
 * /invite, /revoke and /kick: the nickname the user typed
 */
export const moderationTargetValidator = vine.create({
  nickname: nickname(),
})
