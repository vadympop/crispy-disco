import type { DefaultEventsMap, Server } from 'socket.io'
import type { InferData } from '@adonisjs/core/types/transformers'
import { BaseSerializer } from '@adonisjs/core/transformers'
import type Channel from '#models/channel'
import type Message from '#models/message'
import ChannelTransformer from '#transformers/channel_transformer'
import MessageTransformer from '#transformers/message_transformer'

export type MessageData = InferData<MessageTransformer>
export type ChannelData = InferData<ChannelTransformer>
export type SocketUser = { id: string; nickname: string }
export type RemovedReason = 'revoked' | 'banned'

/**
 * Events the server sends. The frontend imports these types through
 * `@cisco-disco/backend/realtime`, so both sides agree on the payloads.
 */
export interface ServerToClientEvents {
  'message:new': (message: MessageData) => void
  'message:updated': (message: MessageData) => void
  'message:deleted': (payload: { channelId: string; messageId: string }) => void
  // an empty text means the user stopped typing
  'typing': (payload: { channelId: string; user: SocketUser; text: string }) => void
  'channel:invited': (channel: ChannelData) => void
  'channel:added': (channel: ChannelData) => void
  'channel:removed': (payload: { channelId: string; reason: RemovedReason }) => void
  'channel:deleted': (payload: { channelId: string }) => void
}

export interface ClientToServerEvents {
  typing: (draft: { channelId: string; text: string }) => void
}

export interface SocketData {
  user: SocketUser
}

export type RealtimeServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  SocketData
>

// every socket joins its user's room, and one room per channel it is a member of
export function userRoom(userId: string) {
  return `user:${userId}`
}

export function channelRoom(channelId: string) {
  return `channel:${channelId}`
}

// Same transformers as the API, but without the { data } wrapper of HTTP
// responses. Socket payloads are never paginated.
class SocketSerializer extends BaseSerializer {
  wrap = undefined

  definePaginationMetaData() {
    return undefined
  }
}

const serializer = new SocketSerializer()

/**
 * Services call this after a change is saved. The socket server only exists
 * in the web process (start/socket.ts), so in tests and ace commands every
 * method does nothing.
 */
class RealtimeService {
  private io: RealtimeServer | null = null

  attach(io: RealtimeServer) {
    this.io = io
  }

  detach() {
    this.io = null
  }

  joinChannel(userId: string, channelId: string) {
    this.io?.in(userRoom(userId)).socketsJoin(channelRoom(channelId))
  }

  leaveChannel(userId: string, channelId: string) {
    this.io?.in(userRoom(userId)).socketsLeave(channelRoom(channelId))
  }

  async messageNew(message: Message) {
    if (!this.io) return
    const data = await serializer.serialize(MessageTransformer.transform(message))
    this.io.to(channelRoom(message.channelId)).emit('message:new', data)
  }

  async messageUpdated(message: Message) {
    if (!this.io) return
    const data = await serializer.serialize(MessageTransformer.transform(message))
    this.io.to(channelRoom(message.channelId)).emit('message:updated', data)
  }

  messageDeleted(channelId: string, messageId: string) {
    this.io?.to(channelRoom(channelId)).emit('message:deleted', { channelId, messageId })
  }

  // `channel` must be loaded for the invited user, so `invited` is true
  async channelInvited(userId: string, channel: Channel) {
    if (!this.io) return
    const data = await serializer.serialize(ChannelTransformer.transform(channel))
    this.io.to(userRoom(userId)).emit('channel:invited', data)
  }

  async channelAdded(userId: string, channel: Channel) {
    if (!this.io) return
    this.joinChannel(userId, channel.id)
    const data = await serializer.serialize(ChannelTransformer.transform(channel))
    this.io.to(userRoom(userId)).emit('channel:added', data)
  }

  channelRemoved(userId: string, channelId: string, reason: RemovedReason) {
    this.leaveChannel(userId, channelId)
    this.io?.to(userRoom(userId)).emit('channel:removed', { channelId, reason })
  }

  channelDeleted(channelId: string) {
    const room = channelRoom(channelId)
    this.io?.to(room).emit('channel:deleted', { channelId })
    this.io?.in(room).socketsLeave(room)
  }
}

const realtime = new RealtimeService()
export default realtime
