import db from '@adonisjs/lucid/services/db'
import Channel from '#models/channel'
import User from '#models/user'

// ids of the channels the user is a full member of (not invited or banned)
function channelsOf(userId: string) {
  return db
    .from('channel_members')
    .select('channel_id')
    .where('user_id', userId)
    .where('status', 'member')
}

export default class UserService {
  // What the viewer has in common with another user, for the profile popup.
  // Only channels both are in count, so the numbers never reveal activity
  // in channels the viewer can't see.
  async statsFor(viewer: User, userId: string) {
    const user = await User.findOrFail(userId)

    // direct chats count for the messages, but aren't listed as channels
    const sharedChannels = await Channel.query()
      .whereIn('id', channelsOf(viewer.id))
      .whereIn('id', channelsOf(user.id))
      .whereNot('type', 'direct')
      .orderBy('name')

    const row = await db
      .from('messages')
      .where('author_id', user.id)
      .whereNull('deleted_at')
      .whereIn('channel_id', channelsOf(viewer.id))
      .whereIn('channel_id', channelsOf(user.id))
      .count('* as total')
      .first()

    // PostgreSQL returns a count as a string, SQLite as a number
    return { messageCount: Number(row?.total ?? 0), sharedChannels }
  }
}
