import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { LoginRequest, SignupRequest, User } from "@/types/api";
import { client } from "@/lib/client";
import { LOCALSTORAGE_KEYS } from "@/lib/storage-keys";
import type { UserStatus } from "@/lib/status";

export type ProfileUpdate = Pick<User, "nickname" | "firstName" | "lastName">;

export const useAuthStore = defineStore("auth", () => {
  const me = ref<User | null>(null);
  const isLoggedIn = computed(() => me.value !== null);

  const userId = computed(() => me.value?.id);
  const nickname = computed(() => me.value?.nickname);

  // true while a stored token is being checked after a page reload
  const isRestoring = ref(false);

  function setSession(user: User, token: string) {
    localStorage.setItem(LOCALSTORAGE_KEYS.authToken, token);
    me.value = user;
  }

  function clearSession() {
    localStorage.removeItem(LOCALSTORAGE_KEYS.authToken);
    me.value = null;
  }

  async function fetchMe() {
    if (!localStorage.getItem(LOCALSTORAGE_KEYS.authToken)) return;
    isRestoring.value = true;
    try {
      const result = await client.api.profile.profile.show({});
      me.value = result.data;
    } catch {
      // token expired or revoked
      clearSession();
    } finally {
      isRestoring.value = false;
    }
  }

  async function login(data: LoginRequest) {
    const result = await client.api.auth.accessTokens.store({ body: data });
    setSession(result.data.user, result.data.token);
  }

  async function signup(data: SignupRequest) {
    const result = await client.api.auth.newAccount.store({ body: data });
    setSession(result.data.user, result.data.token);
  }

  async function logout() {
    try {
      await client.api.profile.accessTokens.destroy({});
    } finally {
      clearSession();
    }
  }

  // TODO: local only until the backend has an endpoint for the status
  function setStatus(status: UserStatus) {
    if (me.value) {
      me.value.status = status;
    }
  }

  // TODO: local only until the backend has a profile update endpoint
  function updateProfile(profile: ProfileUpdate) {
    if (me.value) {
      Object.assign(me.value, profile);
    }
  }

  return {
    me,
    userId,
    nickname,
    isLoggedIn,
    isRestoring,
    clearSession,
    fetchMe,
    login,
    signup,
    logout,
    setStatus,
    updateProfile
  };
});
