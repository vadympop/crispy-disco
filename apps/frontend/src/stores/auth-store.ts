import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { LoginRequest, SignupRequest, User } from '@/types/api'
import { client } from '@/lib/client'
import { LOCALSTORAGE_KEYS } from '@/lib/storage-keys'


export const useAuthStore = defineStore('auth', () => {
  const me = ref<User | null>(null)
  const isLoggedIn = computed(
    () => localStorage.getItem(LOCALSTORAGE_KEYS.authToken) !== null
  )

  async function fetchMe() {
    if (!localStorage.getItem(LOCALSTORAGE_KEYS.authToken)) return
    try {
      const result = await client.api.profile.profile.show({})
      me.value = result.data
    } catch {
      // token expired or revoked
      localStorage.removeItem(LOCALSTORAGE_KEYS.authToken)
      me.value = null
    }
  }

  async function login(data: LoginRequest) {
    const result = await client.api.auth.accessTokens.store({
      body: data
    })
    me.value = result.data.user
    localStorage.setItem(LOCALSTORAGE_KEYS.authToken, result.data.token)
  }

  async function signup(data: SignupRequest) {
    const result = await client.api.auth.newAccount.store({
      body: data
    })
    me.value = result.data.user
    localStorage.setItem(LOCALSTORAGE_KEYS.authToken, result.data.token)
  }

  async function logout() {
    await client.api.profile.accessTokens.destroy({})
    localStorage.removeItem(LOCALSTORAGE_KEYS.authToken)
    me.value = null
  }

  return {
    isLoggedIn,
    me,
    fetchMe,
    login,
    signup,
    logout
  }
})
