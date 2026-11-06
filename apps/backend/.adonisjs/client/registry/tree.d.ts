/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  channels: {
    index: typeof routes['channels.index']
    join: typeof routes['channels.join']
    cancel: typeof routes['channels.cancel']
    decline: typeof routes['channels.decline']
    destroy: typeof routes['channels.destroy']
  }
}
