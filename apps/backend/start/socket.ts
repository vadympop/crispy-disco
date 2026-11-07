import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { Secret } from '@adonisjs/core/helpers'
import { Server } from 'socket.io'
import User from '#models/user'
import realtime, { channelRoom, userRoom, type RealtimeServer } from '#services/realtime_service'
import { MAX_MESSAGE_LENGTH } from '#validators/message'

// Preloads run before the HTTP server exists, it is ready in app.ready
app.ready(() => {
  const nodeServer = server.getNodeServer()
  if (!nodeServer) {
    logger.error('No HTTP server to attach socket.io to')
    return
  }

  // https://socket.io/docs/v4/server-initialization/#with-an-http-server
  const io: RealtimeServer = new Server(nodeServer, {
    // the same origins as config/cors.ts
    cors: { origin: app.inDev ? true : [] },
  })

  // The client sends the same access token as the API: io(url, { auth: { token } })
  // https://socket.io/docs/v4/middlewares/#sending-credentials
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      const accessToken =
        typeof token === 'string' ? await User.accessTokens.verify(new Secret(token)) : null
      const user = accessToken ? await User.find(accessToken.tokenableId) : null
      if (!user) {
        return next(new Error('E_UNAUTHORIZED_ACCESS'))
      }

      socket.data.user = { id: user.id, nickname: user.nickname }
      next()
    } catch (error) {
      next(error as Error)
    }
  })

  io.on('connection', async (socket) => {
    const user = socket.data.user

    // Being in the channel room means being a member, so the draft only goes
    // to other members. The text is the live preview of the draft.
    socket.on('typing', (draft) => {
      if (typeof draft?.channelId !== 'string' || typeof draft.text !== 'string') return
      const room = channelRoom(draft.channelId)
      if (!socket.rooms.has(room)) return

      socket.to(room).emit('typing', {
        channelId: draft.channelId,
        user,
        text: draft.text.slice(0, MAX_MESSAGE_LENGTH),
      })
    })

    try {
      socket.join(userRoom(user.id))
      const memberships = await db
        .from('channel_members')
        .where('user_id', user.id)
        .where('status', 'member')
        .select('channel_id')
      socket.join(memberships.map((row) => channelRoom(row.channel_id)))
    } catch (error) {
      logger.error({ err: error }, 'Could not join the channel rooms')
      socket.disconnect()
    }
  })

  realtime.attach(io)

  // open sockets would keep the HTTP server from closing on shutdown
  app.terminating(() => {
    realtime.detach()
    io.disconnectSockets(true)
  })
})
