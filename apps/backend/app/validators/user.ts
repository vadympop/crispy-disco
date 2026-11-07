import vine from '@vinejs/vine'

/**
 * Shared rules for email, password and nickname.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * 3-30 characters: letters, numbers, _ . and -
 * Also used by the channel commands that take a nickname (/invite, /kick)
 */
export const nickname = () =>
  vine
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_.-]{3,30}$/)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  firstName: vine.string().nullable(),
  lastName: vine.string().nullable(),
  nickname: nickname().unique({ table: 'users', column: 'nickname' }),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
