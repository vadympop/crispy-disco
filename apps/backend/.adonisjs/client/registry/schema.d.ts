/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.new_account.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'channels.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/channels'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['index']>>>
    }
  }
  'channels.join': {
    methods: ["POST"]
    pattern: '/api/v1/channels/join'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').joinChannelValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').joinChannelValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['join']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['join']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'channels.direct': {
    methods: ["POST"]
    pattern: '/api/v1/channels/direct'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').startDirectValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').startDirectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['direct']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['direct']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'channels.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/channels/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['show']>>>
    }
  }
  'channels.members': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/channels/:id/members'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['members']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['members']>>>
    }
  }
  'channels.cancel': {
    methods: ["POST"]
    pattern: '/api/v1/channels/:id/cancel'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['cancel']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['cancel']>>>
    }
  }
  'channels.decline': {
    methods: ["POST"]
    pattern: '/api/v1/channels/:id/decline'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['decline']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['decline']>>>
    }
  }
  'channels.invite': {
    methods: ["POST"]
    pattern: '/api/v1/channels/:id/invite'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').moderationTargetValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').moderationTargetValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['invite']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['invite']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'channels.revoke': {
    methods: ["POST"]
    pattern: '/api/v1/channels/:id/revoke'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').moderationTargetValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').moderationTargetValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['revoke']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['revoke']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'channels.kick': {
    methods: ["POST"]
    pattern: '/api/v1/channels/:id/kick'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').moderationTargetValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').moderationTargetValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['kick']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['kick']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'messages.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/channels/:id/messages'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/message').messageHistoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'messages.store': {
    methods: ["POST"]
    pattern: '/api/v1/channels/:id/messages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/message').sendMessageValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/message').sendMessageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'messages.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/channels/:id/messages/:messageId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/message').editMessageValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; messageId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/message').editMessageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'messages.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/channels/:id/messages/:messageId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; messageId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['destroy']>>>
    }
  }
  'channels.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/channels/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['destroy']>>>
    }
  }
  'users.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
    }
  }
}
