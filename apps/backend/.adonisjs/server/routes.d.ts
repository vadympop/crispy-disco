import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'profile.update_status': { paramsTuple?: []; params?: {} }
    'profile.update_avatar': { paramsTuple?: []; params?: {} }
    'profile.destroy_avatar': { paramsTuple?: []; params?: {} }
    'access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'channels.join': { paramsTuple?: []; params?: {} }
    'channels.direct': { paramsTuple?: []; params?: {} }
    'channels.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.decline': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.kick': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'messageId': ParamValue} }
    'messages.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'messageId': ParamValue} }
    'message_reactions.store': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'messageId': ParamValue,'reaction': ParamValue} }
    'message_reactions.destroy': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'messageId': ParamValue,'reaction': ParamValue} }
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.stats': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.avatar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'profile.show': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'channels.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.stats': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.avatar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'profile.show': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'channels.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.stats': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.avatar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.update_avatar': { paramsTuple?: []; params?: {} }
    'access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'channels.join': { paramsTuple?: []; params?: {} }
    'channels.direct': { paramsTuple?: []; params?: {} }
    'channels.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.decline': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.kick': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'profile.update': { paramsTuple?: []; params?: {} }
    'messages.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'messageId': ParamValue} }
  }
  PUT: {
    'profile.update_status': { paramsTuple?: []; params?: {} }
    'message_reactions.store': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'messageId': ParamValue,'reaction': ParamValue} }
  }
  DELETE: {
    'profile.destroy_avatar': { paramsTuple?: []; params?: {} }
    'messages.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'messageId': ParamValue} }
    'message_reactions.destroy': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'messageId': ParamValue,'reaction': ParamValue} }
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}