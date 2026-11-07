import type Message from '#models/message'

export type CursorPosition = { createdAt: Date; id: string }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function encodeCursor(message: Message) {
  if (!message.createdAt) {
    return null
  }
  return Buffer.from(`${message.createdAt.toMillis()}:${message.id}`).toString('base64url')
}

export function decodeCursor(cursor: string): CursorPosition | null {
  const [millis, id] = Buffer.from(cursor, 'base64url').toString().split(':')
  const time = Number(millis)
  if (!Number.isSafeInteger(time) || !id || !UUID_PATTERN.test(id)) {
    return null
  }
  return { createdAt: new Date(time), id }
}
