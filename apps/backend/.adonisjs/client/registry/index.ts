/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [{"old":"/api/v1/auth/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [{"old":"/api/v1/account/logout","type":0,"val":"api","end":""},{"old":"/api/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/account/logout","type":0,"val":"account","end":""},{"old":"/api/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'channels.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels',
    tokens: [{"old":"/api/v1/channels","type":0,"val":"api","end":""},{"old":"/api/v1/channels","type":0,"val":"v1","end":""},{"old":"/api/v1/channels","type":0,"val":"channels","end":""}],
    types: placeholder as Registry['channels.index']['types'],
  },
  'channels.join': {
    methods: ["POST"],
    pattern: '/api/v1/channels/join',
    tokens: [{"old":"/api/v1/channels/join","type":0,"val":"api","end":""},{"old":"/api/v1/channels/join","type":0,"val":"v1","end":""},{"old":"/api/v1/channels/join","type":0,"val":"channels","end":""},{"old":"/api/v1/channels/join","type":0,"val":"join","end":""}],
    types: placeholder as Registry['channels.join']['types'],
  },
  'channels.direct': {
    methods: ["POST"],
    pattern: '/api/v1/channels/direct',
    tokens: [{"old":"/api/v1/channels/direct","type":0,"val":"api","end":""},{"old":"/api/v1/channels/direct","type":0,"val":"v1","end":""},{"old":"/api/v1/channels/direct","type":0,"val":"channels","end":""},{"old":"/api/v1/channels/direct","type":0,"val":"direct","end":""}],
    types: placeholder as Registry['channels.direct']['types'],
  },
  'channels.cancel': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:name/cancel',
    tokens: [{"old":"/api/v1/channels/:name/cancel","type":0,"val":"api","end":""},{"old":"/api/v1/channels/:name/cancel","type":0,"val":"v1","end":""},{"old":"/api/v1/channels/:name/cancel","type":0,"val":"channels","end":""},{"old":"/api/v1/channels/:name/cancel","type":1,"val":"name","end":""},{"old":"/api/v1/channels/:name/cancel","type":0,"val":"cancel","end":""}],
    types: placeholder as Registry['channels.cancel']['types'],
  },
  'channels.decline': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:name/decline',
    tokens: [{"old":"/api/v1/channels/:name/decline","type":0,"val":"api","end":""},{"old":"/api/v1/channels/:name/decline","type":0,"val":"v1","end":""},{"old":"/api/v1/channels/:name/decline","type":0,"val":"channels","end":""},{"old":"/api/v1/channels/:name/decline","type":1,"val":"name","end":""},{"old":"/api/v1/channels/:name/decline","type":0,"val":"decline","end":""}],
    types: placeholder as Registry['channels.decline']['types'],
  },
  'channels.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/channels/:name',
    tokens: [{"old":"/api/v1/channels/:name","type":0,"val":"api","end":""},{"old":"/api/v1/channels/:name","type":0,"val":"v1","end":""},{"old":"/api/v1/channels/:name","type":0,"val":"channels","end":""},{"old":"/api/v1/channels/:name","type":1,"val":"name","end":""}],
    types: placeholder as Registry['channels.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
