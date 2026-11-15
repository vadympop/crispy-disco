import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { LoginRequest, SignupRequest, User } from "@/types/api";
import { client } from "@/lib/client";
import { LOCALSTORAGE_KEYS } from "@/lib/storage-keys";
import type { UserStatus } from "@/lib/status";

export type ProfileUpdate = Partial<
  Pick<User, "nickname" | "firstName" | "lastName" | "notifyMentionsOnly">
>;

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
      const result = await client.api.profile.show({});
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
      await client.api.accessTokens.destroy({});
    } finally {
      clearSession();
    }
  }

  // The server checks the values (a free nickname, a valid status) and
  // answers with the whole saved profile. Its errors are shown by the
  // api-errors boot file, the caller only needs to know it failed.
  async function setStatus(status: UserStatus) {
    const result = await client.api.profile.updateStatus({ body: { status } });
    me.value = result.data;
  }

  async function updateProfile(changes: ProfileUpdate) {
    const result = await client.api.profile.update({ body: changes });
    me.value = result.data;
  }

  // the picture is already cropped to a small JPEG by the settings dialog
  async function uploadAvatar(file: File) {
    const result = await client.api.profile.updateAvatar({
      body: { avatar: file }
    });
    me.value = result.data;
  }

  async function removeAvatar() {
    const result = await client.api.profile.destroyAvatar({});
    me.value = result.data;
  }

  // I changed my status in another tab
  function onStatusChanged(id: string, status: UserStatus) {
    if (me.value && id === me.value.id) {
      me.value.status = status;
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
    updateProfile,
    uploadAvatar,
    removeAvatar,
    onStatusChanged
  };
});
