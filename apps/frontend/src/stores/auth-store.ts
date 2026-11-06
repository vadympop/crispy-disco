import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { LoginRequest, SignupRequest, User } from '@/types/api'
import { client } from '@/lib/client'
import { LOCALSTORAGE_KEYS } from '@/lib/storage-keys'


export const useAuthStore = defineStore('auth', () => {
  const me = ref<User | null>(null)
  const isLoggedIn = computed(() => me.value !== null)

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
    login,
    signup,
    logout
  }
})
