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
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
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
        router.delete(':id', [controllers.Channels, 'destroy'])
      })
      .where('id', router.matchers.uuid())
      .prefix('channels')
      .use(middleware.auth())

    router
      .group(() => {
        router.get(':id', [controllers.Users, 'show'])
      })
      .where('id', router.matchers.uuid())
      .prefix('users')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
