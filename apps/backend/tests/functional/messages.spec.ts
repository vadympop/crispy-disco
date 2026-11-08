import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import Channel from '#models/channel'
import Message from '#models/message'
import User from '#models/user'
import { encodeCursor } from '#services/message_cursor'

function unique(base: string) {
  return `${base}_${Math.random().toString(36).slice(2, 8)}`
}

async function createUser(base: string) {
  const nickname = unique(base)
  return User.create({ nickname, email: `${nickname}@example.com`, password: 'secret123' })
}

async function createChannel(admin: User, members: User[] = []) {
  const channel = await Channel.create({
    name: unique('chan'),
    type: 'public',
    creatorId: admin.id,
    lastActivityAt: DateTime.now().minus({ days: 1 }),
  })
  const rows = Object.fromEntries(
    [admin, ...members].map((user) => [user.id, { status: 'member' }])
  )
  await channel.related('members').attach(rows)
  return channel
}

async function seedMessages(channel: Channel, author: User, count: number, sameTime = false) {
  const start = DateTime.now().minus({ hours: 1 })
  const ids: string[] = []
  for (let i = 0; i < count; i++) {
    const message = await Message.create({
      channelId: channel.id,
      authorId: author.id,
      content: `message ${i}`,
    })
    // set through the model, so Lucid formats the date like the app does
    // (a raw JS Date is stored by SQLite as a number it can't read back)
    message.createdAt = sameTime ? start : start.plus({ minutes: i })
    await message.save()
    ids.push(message.id)
  }
  return ids
}

async function cursorOf(id: string | undefined) {
  if (!id) {
    throw new Error('no message with that index was seeded')
  }
  return encodeCursor(await Message.findOrFail(id))
}

type SentBody = { data: { id: string } }
type EditedBody = { data: { content: string; editedAt: string | null } }
type HistoryBody = {
  data: {
    messages: {
      id: string
      content: string
      cursor: string
      author: { id: string; nickname: string }
    }[]
    hasMore: boolean
  }
}

function page(response: { body(): unknown }) {
  const { data } = response.body() as HistoryBody
  return { ...data, ids: data.messages.map((message) => message.id) }
}

test.group('Messages / send', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('a member sends a message and it counts as channel activity', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const activityBefore = channel.lastActivityAt!

    const response = await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .loginAs(alice)
      .json({ content: '  hello  ' })

    response.assertStatus(201)
    response.assertBodyContains({
      data: {
        channelId: channel.id,
        content: 'hello',
        author: { id: alice.id, nickname: alice.nickname },
      },
    })

    await channel.refresh()
    assert.isTrue(channel.lastActivityAt! > activityBefore)
  })

  test('only mentions of channel members are saved', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const bob = await createUser('bob')
    const carol = await createUser('carol')
    const channel = await createChannel(alice, [bob])

    const response = await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .loginAs(alice)
      .json({ content: `hi @${carol.nickname}, @${bob.nickname}.` })

    response.assertStatus(201)
    const message = await Message.findOrFail((response.body() as SentBody).data.id)
    await message.load('mentions')
    assert.deepEqual(
      message.mentions.map((user) => user.id),
      [bob.id]
    )
  })

  test('a non-member cannot send or read messages', async ({ client }) => {
    const alice = await createUser('alice')
    const outsider = await createUser('mallory')
    const channel = await createChannel(alice)

    const send = await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .loginAs(outsider)
      .json({ content: 'hello' })
    send.assertStatus(403)

    const list = await client.get(`/api/v1/channels/${channel.id}/messages`).loginAs(outsider)
    list.assertStatus(403)
  })

  test('an empty message is rejected', async ({ client }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)

    const response = await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .loginAs(alice)
      .json({ content: '   ' })

    response.assertStatus(422)
  })

  test('the content is stored encrypted', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)

    const response = await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .loginAs(alice)
      .json({ content: 'top secret' })

    const id = (response.body() as SentBody).data.id
    const row = await db.from('messages').where('id', id).firstOrFail()
    assert.notInclude(row.content, 'top secret')

    const message = await Message.findOrFail(id)
    assert.equal(message.content, 'top secret')
  })
})

test.group('Messages / history', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('without a cursor it returns the newest page, oldest to newest', async ({
    client,
    assert,
  }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const messages = await seedMessages(channel, alice, 5)

    const response = await client
      .get(`/api/v1/channels/${channel.id}/messages`)
      .qs({ limit: 2 })
      .loginAs(alice)

    response.assertStatus(200)
    assert.deepEqual(page(response).ids, messages.slice(3, 5))
    assert.isTrue(page(response).hasMore)
    assert.properties(page(response).messages[0]?.author, ['id', 'nickname'])
  })

  test('before pages backwards until the first message', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const messages = await seedMessages(channel, alice, 5)
    const url = `/api/v1/channels/${channel.id}/messages`

    const older = await client
      .get(url)
      .qs({ before: await cursorOf(messages[3]), limit: 2 })
      .loginAs(alice)
    assert.deepEqual(page(older).ids, messages.slice(1, 3))
    assert.isTrue(page(older).hasMore)

    const last = await client
      .get(url)
      .qs({ before: await cursorOf(messages[1]), limit: 2 })
      .loginAs(alice)
    assert.deepEqual(page(last).ids, messages.slice(0, 1))
    assert.isFalse(page(last).hasMore)
  })

  test('after returns the messages that came later', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const messages = await seedMessages(channel, alice, 5)
    const url = `/api/v1/channels/${channel.id}/messages`

    const all = await client
      .get(url)
      .qs({ after: await cursorOf(messages[1]) })
      .loginAs(alice)
    assert.deepEqual(page(all).ids, messages.slice(2))
    assert.isFalse(page(all).hasMore)

    const limited = await client
      .get(url)
      .qs({ after: await cursorOf(messages[1]), limit: 2 })
      .loginAs(alice)
    assert.deepEqual(page(limited).ids, messages.slice(2, 4))
    assert.isTrue(page(limited).hasMore)
  })

  test('messages with the same created_at are neither skipped nor repeated', async ({
    client,
    assert,
  }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const messages = await seedMessages(channel, alice, 4, true)
    const url = `/api/v1/channels/${channel.id}/messages`

    const seen: string[] = []
    let response = await client.get(url).qs({ limit: 1 }).loginAs(alice)
    seen.unshift(...page(response).ids)
    while (page(response).hasMore) {
      const before = page(response).messages[0]?.cursor
      response = await client.get(url).qs({ before, limit: 1 }).loginAs(alice)
      seen.unshift(...page(response).ids)
    }

    assert.sameMembers(seen, messages)
    assert.lengthOf(seen, messages.length)
  })

  test('a cursor that the server did not issue is rejected', async ({ client }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const [messageId] = await seedMessages(channel, alice, 1)
    const url = `/api/v1/channels/${channel.id}/messages`

    const plainId = await client.get(url).qs({ before: messageId }).loginAs(alice)
    plainId.assertStatus(422)

    const garbage = await client.get(url).qs({ after: 'not-a-cursor' }).loginAs(alice)
    garbage.assertStatus(422)
  })

  test('limit above the maximum is rejected', async ({ client }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)

    const response = await client
      .get(`/api/v1/channels/${channel.id}/messages`)
      .qs({ limit: 101 })
      .loginAs(alice)

    response.assertStatus(422)
  })
})

test.group('Messages / delete', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('the author deletes a message and it leaves the history', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const messages = await seedMessages(channel, alice, 3)
    const url = `/api/v1/channels/${channel.id}/messages`

    const deleted = messages[1]
    const response = await client.delete(`${url}/${deleted}`).loginAs(alice)
    response.assertStatus(204)

    const history = await client.get(url).loginAs(alice)
    assert.deepEqual(
      page(history).ids,
      messages.filter((id) => id !== deleted)
    )
  })

  test('a cursor keeps working after its message is deleted', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const messages = await seedMessages(channel, alice, 5)
    const url = `/api/v1/channels/${channel.id}/messages`
    const cursor = await cursorOf(messages[2])

    await client.delete(`${url}/${messages[2]}`).loginAs(alice)

    const older = await client.get(url).qs({ before: cursor }).loginAs(alice)
    older.assertStatus(200)
    assert.deepEqual(page(older).ids, messages.slice(0, 2))

    const newer = await client.get(url).qs({ after: cursor }).loginAs(alice)
    newer.assertStatus(200)
    assert.deepEqual(page(newer).ids, messages.slice(3, 5))
  })

  test('a cursor keeps working after its row is removed from the database', async ({
    client,
    assert,
  }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const messages = await seedMessages(channel, alice, 3)
    const cursor = await cursorOf(messages[1])

    await db
      .from('messages')
      .where('id', messages[1] ?? '')
      .delete()

    const older = await client
      .get(`/api/v1/channels/${channel.id}/messages`)
      .qs({ before: cursor })
      .loginAs(alice)
    older.assertStatus(200)
    assert.deepEqual(page(older).ids, messages.slice(0, 1))
  })

  test('the admin can delete any message, other members only their own', async ({ client }) => {
    const alice = await createUser('alice')
    const bob = await createUser('bob')
    const carol = await createUser('carol')
    const channel = await createChannel(alice, [bob, carol])
    const [fromBob] = await seedMessages(channel, bob, 1)
    const url = `/api/v1/channels/${channel.id}/messages/${fromBob}`

    const byCarol = await client.delete(url).loginAs(carol)
    byCarol.assertStatus(403)

    const byAdmin = await client.delete(url).loginAs(alice)
    byAdmin.assertStatus(204)
  })

  test('deleting twice or from another channel returns 404', async ({ client }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const other = await createChannel(alice)
    const [messageId] = await seedMessages(channel, alice, 1)

    const wrongChannel = await client
      .delete(`/api/v1/channels/${other.id}/messages/${messageId}`)
      .loginAs(alice)
    wrongChannel.assertStatus(404)

    const url = `/api/v1/channels/${channel.id}/messages/${messageId}`
    await client.delete(url).loginAs(alice)
    const again = await client.delete(url).loginAs(alice)
    again.assertStatus(404)
  })
})

test.group('Messages / edit', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('the author edits a message and it is marked as edited', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const [messageId] = await seedMessages(channel, alice, 1)
    const url = `/api/v1/channels/${channel.id}/messages`

    const response = await client
      .patch(`${url}/${messageId}`)
      .loginAs(alice)
      .json({ content: '  fixed typo  ' })

    response.assertStatus(200)
    const edited = response.body() as EditedBody
    assert.equal(edited.data.content, 'fixed typo')
    assert.isNotNull(edited.data.editedAt)

    const history = await client.get(url).loginAs(alice)
    assert.deepEqual(page(history).ids, [messageId])
    assert.equal(page(history).messages[0]?.content, 'fixed typo')
  })

  test('editing replaces the saved mentions', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const bob = await createUser('bob')
    const carol = await createUser('carol')
    const channel = await createChannel(alice, [bob, carol])
    const url = `/api/v1/channels/${channel.id}/messages`

    const sent = await client
      .post(url)
      .loginAs(alice)
      .json({ content: `hi @${bob.nickname}` })
    const id = (sent.body() as SentBody).data.id

    await client
      .patch(`${url}/${id}`)
      .loginAs(alice)
      .json({ content: `hi @${carol.nickname}` })

    const message = await Message.findOrFail(id)
    await message.load('mentions')
    assert.deepEqual(
      message.mentions.map((user) => user.id),
      [carol.id]
    )
  })

  test('nobody else can edit a message, not even the admin', async ({ client }) => {
    const alice = await createUser('alice')
    const bob = await createUser('bob')
    const channel = await createChannel(alice, [bob])
    const [fromBob] = await seedMessages(channel, bob, 1)

    const response = await client
      .patch(`/api/v1/channels/${channel.id}/messages/${fromBob}`)
      .loginAs(alice)
      .json({ content: 'changed' })

    response.assertStatus(403)
  })

  test('a deleted message cannot be edited', async ({ client }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const [messageId] = await seedMessages(channel, alice, 1)
    const url = `/api/v1/channels/${channel.id}/messages/${messageId}`

    await client.delete(url).loginAs(alice)
    const response = await client.patch(url).loginAs(alice).json({ content: 'changed' })

    response.assertStatus(404)
  })

  test('an empty edit is rejected', async ({ client }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const [messageId] = await seedMessages(channel, alice, 1)

    const response = await client
      .patch(`/api/v1/channels/${channel.id}/messages/${messageId}`)
      .loginAs(alice)
      .json({ content: '  ' })

    response.assertStatus(422)
  })
})
