/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.patch('profile', [controllers.Profile, 'update'])
        router.put('status', [controllers.Profile, 'updateStatus'])
        router.post('avatar', [controllers.Profile, 'updateAvatar'])
        router.delete('avatar', [controllers.Profile, 'destroyAvatar'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .use(middleware.auth())
    router
      .group(() => {
        router.get('/', [controllers.Channels, 'index'])
        router.post('join', [controllers.Channels, 'join'])
        router.post('direct', [controllers.Channels, 'direct'])
        // channels are addressed by id: a name can be reused after the channel is gone
        router.get(':id', [controllers.Channels, 'show'])
        router.get(':id/members', [controllers.Channels, 'members'])
        router.post(':id/cancel', [controllers.Channels, 'cancel'])
        router.post(':id/decline', [controllers.Channels, 'decline'])
        router.post(':id/invite', [controllers.Channels, 'invite'])
        router.post(':id/revoke', [controllers.Channels, 'revoke'])
        router.post(':id/kick', [controllers.Channels, 'kick'])
        router.get(':id/messages', [controllers.Messages, 'index'])
        router.post(':id/messages', [controllers.Messages, 'store'])
        router
          .patch(':id/messages/:messageId', [controllers.Messages, 'update'])
          .where('messageId', router.matchers.uuid())
        router
          .delete(':id/messages/:messageId', [controllers.Messages, 'destroy'])
          .where('messageId', router.matchers.uuid())
        // the reaction key is checked by the validator (422 for an unknown one)
        router
          .put(':id/messages/:messageId/reactions/:reaction', [
            controllers.MessageReactions,
            'store',
          ])
          .where('messageId', router.matchers.uuid())
        router
          .delete(':id/messages/:messageId/reactions/:reaction', [
            controllers.MessageReactions,
            'destroy',
          ])
          .where('messageId', router.matchers.uuid())
        router.delete(':id', [controllers.Channels, 'destroy'])
      })
      .where('id', router.matchers.uuid())
      .prefix('channels')
      .use(middleware.auth())

    router
      .group(() => {
        router.get(':id', [controllers.Users, 'show'])
        router.get(':id/stats', [controllers.Users, 'stats'])
      })
      .where('id', router.matchers.uuid())
      .prefix('users')
      .use(middleware.auth())

    // no auth: an <img> tag can't send the bearer token, and pictures are public
    router
      .get('users/:id/avatar', [controllers.Users, 'avatar'])
      .where('id', router.matchers.uuid())
  })
  .prefix('/api/v1')
