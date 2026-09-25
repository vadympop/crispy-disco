import { createTuyau } from '@tuyau/core/client'
import { registry } from '@cisco-disco/backend/registry'

export const client = createTuyau({
  baseUrl: import.meta.env.API_URL || 'http://localhost:3333',
  // @ts-expect-error
  registry,
  headers: { Accept: 'application/json' },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
  },
})
