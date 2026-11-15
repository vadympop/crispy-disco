import { test } from '@japa/runner'
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import AvatarService from '#services/avatar_service'

function unique(base: string) {
  return `${base}_${Math.random().toString(36).slice(2, 8)}`
}

async function createUser(base: string) {
  const nickname = unique(base)
  return User.create({ nickname, email: `${nickname}@example.com`, password: 'secret123' })
}

// The first bytes of a JPEG (SOI + JFIF header): enough for the type check
const JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
])

type ProfileBody = {
  data: {
    nickname: string
    firstName: string | null
    status: string
    notifyMentionsOnly: boolean
    avatarUrl: string | null
  }
}

test.group('Profile / update', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('changes only the given fields', async ({ client, assert }) => {
    const alice = await createUser('alice')

    const response = await client
      .patch('/api/v1/account/profile')
      .json({ firstName: 'Alice', notifyMentionsOnly: true })
      .loginAs(alice)

    response.assertStatus(200)
    const { data } = response.body() as ProfileBody
    assert.equal(data.firstName, 'Alice')
    assert.isTrue(data.notifyMentionsOnly)
    assert.equal(data.nickname, alice.nickname)
  })

  test('accepts the nickname the user already has', async ({ client }) => {
    const alice = await createUser('alice')

    const response = await client
      .patch('/api/v1/account/profile')
      .json({ nickname: alice.nickname })
      .loginAs(alice)

    response.assertStatus(200)
  })

  test('rejects a nickname another user has', async ({ client }) => {
    const alice = await createUser('alice')
    const bob = await createUser('bob')

    const response = await client
      .patch('/api/v1/account/profile')
      .json({ nickname: bob.nickname })
      .loginAs(alice)

    response.assertStatus(422)
  })

  test('needs a token', async ({ client }) => {
    const response = await client.patch('/api/v1/account/profile').json({ firstName: 'Nobody' })
    response.assertStatus(401)
  })
})

test.group('Profile / status', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('sets a valid status', async ({ client, assert }) => {
    const alice = await createUser('alice')

    const response = await client
      .put('/api/v1/account/status')
      .json({ status: 'dnd' })
      .loginAs(alice)

    response.assertStatus(200)
    assert.equal((response.body() as ProfileBody).data.status, 'dnd')
  })

  test('rejects an unknown status', async ({ client }) => {
    const alice = await createUser('alice')

    const response = await client
      .put('/api/v1/account/status')
      // @ts-expect-error the body type only allows valid statuses, this one is wrong on purpose
      .json({ status: 'away' })
      .loginAs(alice)

    response.assertStatus(422)
  })
})

test.group('Profile / avatar', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  const avatars = new AvatarService()
  // the database is rolled back after each test, the files have to be removed by hand
  const created: string[] = []
  group.teardown(async () => {
    await Promise.all(
      created.map((id) => rm(avatars.folderOf(id), { recursive: true, force: true }))
    )
  })

  test('uploads, serves and removes the picture', async ({ client, assert }) => {
    const alice = await createUser('alice')
    created.push(alice.id)

    const upload = await client
      .post('/api/v1/account/avatar')
      .file('avatar', JPEG, { filename: 'me.jpg' })
      .loginAs(alice)

    upload.assertStatus(200)
    const avatarUrl = (upload.body() as ProfileBody).data.avatarUrl
    assert.isString(avatarUrl)
    assert.isTrue(existsSync(avatars.pathOf(alice.id)))

    // public: no loginAs
    const image = await client.get(avatarUrl!)
    image.assertStatus(200)

    const removed = await client.delete('/api/v1/account/avatar').loginAs(alice)
    removed.assertStatus(200)
    assert.isNull((removed.body() as ProfileBody).data.avatarUrl)
    assert.isFalse(existsSync(avatars.folderOf(alice.id)))
  })

  test('rejects a file that is not a JPEG', async ({ client }) => {
    const alice = await createUser('alice')

    const response = await client
      .post('/api/v1/account/avatar')
      .file('avatar', Buffer.from('not an image'), { filename: 'me.txt' })
      .loginAs(alice)

    response.assertStatus(422)
  })

  test('returns 404 for a user without a picture', async ({ client }) => {
    const alice = await createUser('alice')

    const response = await client.get(`/api/v1/users/${alice.id}/avatar`)
    response.assertStatus(404)
  })
})
