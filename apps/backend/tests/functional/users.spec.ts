import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import Channel from '#models/channel'
import Message from '#models/message'
import User from '#models/user'

function unique(base: string) {
  return `${base}_${Math.random().toString(36).slice(2, 8)}`
}

async function createUser(base: string) {
  const nickname = unique(base)
  return User.create({ nickname, email: `${nickname}@example.com`, password: 'secret123' })
}

async function createChannel(
  admin: User,
  members: User[] = [],
  type: 'public' | 'private' | 'direct' = 'public'
) {
  const channel = await Channel.create({
    name: unique('chan'),
    type,
    creatorId: admin.id,
    lastActivityAt: DateTime.now(),
  })
  const rows = Object.fromEntries(
    [admin, ...members].map((user) => [user.id, { status: 'member' }])
  )
  await channel.related('members').attach(rows)
  return channel
}

async function seedMessages(channel: Channel, author: User, count: number) {
  const messages: Message[] = []
  for (let i = 0; i < count; i++) {
    messages.push(
      await Message.create({ channelId: channel.id, authorId: author.id, content: `message ${i}` })
    )
  }
  return messages
}

type StatsBody = {
  data: { messageCount: number; sharedChannels: { id: string; name: string }[] }
}

test.group('Users / stats', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('counts only messages in channels both users are in', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const bob = await createUser('bob')
    const shared = await createChannel(alice, [bob])
    const bobsOwn = await createChannel(bob)
    await seedMessages(shared, bob, 3)
    await seedMessages(bobsOwn, bob, 5)

    const response = await client.get(`/api/v1/users/${bob.id}/stats`).loginAs(alice)

    response.assertStatus(200)
    const { data } = response.body() as StatsBody
    assert.equal(data.messageCount, 3)
    assert.deepEqual(data.sharedChannels, [{ id: shared.id, name: shared.name }])
  })

  test('ignores deleted messages and invites', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const bob = await createUser('bob')
    const shared = await createChannel(alice, [bob])
    const invitedTo = await createChannel(bob)
    await invitedTo.related('members').attach({ [alice.id]: { status: 'invited' } })
    const [deleted] = await seedMessages(shared, bob, 2)
    await seedMessages(invitedTo, bob, 4)
    deleted!.deletedAt = DateTime.now()
    await deleted!.save()

    const response = await client.get(`/api/v1/users/${bob.id}/stats`).loginAs(alice)

    const { data } = response.body() as StatsBody
    assert.equal(data.messageCount, 1)
    assert.lengthOf(data.sharedChannels, 1)
  })

  test('counts a direct chat but does not list it', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const bob = await createUser('bob')
    const direct = await createChannel(alice, [bob], 'direct')
    await seedMessages(direct, bob, 2)

    const response = await client.get(`/api/v1/users/${bob.id}/stats`).loginAs(alice)

    const { data } = response.body() as StatsBody
    assert.equal(data.messageCount, 2)
    assert.lengthOf(data.sharedChannels, 0)
  })

  test('returns 404 for an unknown user', async ({ client }) => {
    const alice = await createUser('alice')
    const response = await client
      .get('/api/v1/users/00000000-0000-4000-8000-000000000000/stats')
      .loginAs(alice)
    response.assertStatus(404)
  })
})
