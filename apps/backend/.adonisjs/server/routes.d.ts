import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'channels.join': { paramsTuple?: []; params?: {} }
    'channels.direct': { paramsTuple?: []; params?: {} }
    'channels.cancel': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'channels.decline': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
  GET: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'channels.join': { paramsTuple?: []; params?: {} }
    'channels.direct': { paramsTuple?: []; params?: {} }
    'channels.cancel': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'channels.decline': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
  DELETE: {
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}