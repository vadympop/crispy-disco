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

/**
 * Validator for PATCH /account/profile. Every field is optional, only the
 * given ones change. The nickname must be free, but keeping your own is fine,
 * so the unique check skips the user passed in the metadata.
 * https://docs.adonisjs.com/guides/basics/validation#passing-metadata-to-the-validator
 */
export const updateProfileValidator = vine.withMetaData<{ userId: string }>().create({
  firstName: vine.string().trim().maxLength(50).nullable().optional(),
  lastName: vine.string().trim().maxLength(50).nullable().optional(),
  nickname: nickname()
    .unique({
      table: 'users',
      column: 'nickname',
      filter: (query, _value, field) => {
        query.whereNot('id', field.meta.userId)
      },
    })
    .optional(),
  notifyMentionsOnly: vine.boolean().optional(),
})

export const USER_STATUSES = ['online', 'dnd', 'offline'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

/**
 * Validator for PUT /account/status
 */
export const updateStatusValidator = vine.create({
  status: vine.enum(USER_STATUSES),
})

/**
 * Validator for POST /account/avatar. The frontend already crops the picture
 * to a small square JPEG, so only JPEG is accepted and it is stored as is.
 * https://docs.adonisjs.com/guides/basics/file-uploads#validating-files
 */
export const updateAvatarValidator = vine.create({
  avatar: vine.file({ size: '2mb', extnames: ['jpg', 'jpeg'] }),
})
