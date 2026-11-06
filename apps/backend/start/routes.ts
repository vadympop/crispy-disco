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
        router.post(':name/cancel', [controllers.Channels, 'cancel'])
        router.post(':name/decline', [controllers.Channels, 'decline'])
        router.delete(':name', [controllers.Channels, 'destroy'])
      })
      .prefix('channels')
      .use(middleware.auth())

    router
      .group(() => {
        router.get(':id', [controllers.Users, 'show'])
      })
      .prefix('users')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
