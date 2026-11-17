import type { DefaultEventsMap, Server } from 'socket.io'
import type { InferData } from '@adonisjs/core/types/transformers'
import { BaseSerializer } from '@adonisjs/core/transformers'
import db from '@adonisjs/lucid/services/db'
import type Channel from '#models/channel'
import type Message from '#models/message'
import type User from '#models/user'
import type { UserStatus } from '#validators/user'
import ChannelTransformer from '#transformers/channel_transformer'
import MessageTransformer, { type ReactionGroup } from '#transformers/message_transformer'

export type { ReactionGroup } from '#transformers/message_transformer'
export type { Reaction } from '#validators/message'

export type MessageData = InferData<MessageTransformer>
export type ChannelData = InferData<ChannelTransformer>
export type SocketUser = { id: string; nickname: string }
export type RemovedReason = 'revoked' | 'banned'

export interface ServerToClientEvents {
  'message:new': (message: MessageData) => void
  'message:updated': (message: MessageData) => void
  'message:deleted': (payload: { channelId: string; messageId: string }) => void
  'message:reactions': (payload: {
    channelId: string
    messageId: string
    reactions: ReactionGroup[]
  }) => void
  'typing': (payload: { channelId: string; user: SocketUser; text: string }) => void
  'channel:invited': (channel: ChannelData) => void
  'channel:added': (channel: ChannelData) => void
  'channel:removed': (payload: { channelId: string; reason: RemovedReason }) => void
  'channel:deleted': (payload: { channelId: string }) => void
  'user:status': (payload: { userId: string; status: UserStatus }) => void
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

export function userRoom(userId: string) {
  return `user:${userId}`
}

export function channelRoom(channelId: string) {
  return `channel:${channelId}`
}

class SocketSerializer extends BaseSerializer {
  wrap = undefined

  definePaginationMetaData() {
    return undefined
  }
}

const serializer = new SocketSerializer()

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

  messageReactions(channelId: string, messageId: string, reactions: ReactionGroup[]) {
    this.io?.to(channelRoom(channelId)).emit('message:reactions', {
      channelId,
      messageId,
      reactions,
    })
  }

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

  // Only the status is sent live
  async userStatusChanged(user: User) {
    if (!this.io) return
    const memberships = await db
      .from('channel_members')
      .where('user_id', user.id)
      .where('status', 'member')
      .select('channel_id')
    const rooms = [userRoom(user.id), ...memberships.map((row) => channelRoom(row.channel_id))]

    this.io.to(rooms).emit('user:status', {
      userId: user.id,
      status: user.status as UserStatus,
    })
  }

  channelDeleted(channelId: string) {
    const room = channelRoom(channelId)
    this.io?.to(room).emit('channel:deleted', { channelId })
    this.io?.in(room).socketsLeave(room)
  }
}

const realtime = new RealtimeService()
export default realtime
