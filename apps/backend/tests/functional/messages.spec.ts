import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
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
  const messages: Message[] = []
  for (let i = 0; i < count; i++) {
    const message = await Message.create({
      channelId: channel.id,
      authorId: author.id,
      content: `message ${i}`,
    })
    const createdAt = sameTime ? start : start.plus({ minutes: i })
    await Message.query().where('id', message.id).update({ created_at: createdAt.toJSDate() })
    messages.push(message)
  }
  return messages
}

type SentBody = { data: { id: string } }
type HistoryBody = {
  data: {
    messages: { id: string; author: { id: string; nickname: string } }[]
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
    assert.deepEqual(page(response).ids, [messages[3].id, messages[4].id])
    assert.isTrue(page(response).hasMore)
    assert.properties(page(response).messages[0].author, ['id', 'nickname'])
  })

  test('before pages backwards until the first message', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const messages = await seedMessages(channel, alice, 5)
    const url = `/api/v1/channels/${channel.id}/messages`

    const older = await client.get(url).qs({ before: messages[3].id, limit: 2 }).loginAs(alice)
    assert.deepEqual(page(older).ids, [messages[1].id, messages[2].id])
    assert.isTrue(page(older).hasMore)

    const last = await client.get(url).qs({ before: messages[1].id, limit: 2 }).loginAs(alice)
    assert.deepEqual(page(last).ids, [messages[0].id])
    assert.isFalse(page(last).hasMore)
  })

  test('after returns the messages that came later', async ({ client, assert }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const messages = await seedMessages(channel, alice, 5)
    const url = `/api/v1/channels/${channel.id}/messages`

    const all = await client.get(url).qs({ after: messages[1].id }).loginAs(alice)
    assert.deepEqual(
      page(all).ids,
      messages.slice(2).map((message) => message.id)
    )
    assert.isFalse(page(all).hasMore)

    const limited = await client.get(url).qs({ after: messages[1].id, limit: 2 }).loginAs(alice)
    assert.deepEqual(page(limited).ids, [messages[2].id, messages[3].id])
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
      response = await client.get(url).qs({ before: seen[0], limit: 1 }).loginAs(alice)
      seen.unshift(...page(response).ids)
    }

    assert.sameMembers(
      seen,
      messages.map((message) => message.id)
    )
    assert.lengthOf(seen, messages.length)
  })

  test('a cursor from another channel is rejected', async ({ client }) => {
    const alice = await createUser('alice')
    const channel = await createChannel(alice)
    const other = await createChannel(alice)
    const [foreign] = await seedMessages(other, alice, 1)

    const response = await client
      .get(`/api/v1/channels/${channel.id}/messages`)
      .qs({ before: foreign.id })
      .loginAs(alice)

    response.assertStatus(404)
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
