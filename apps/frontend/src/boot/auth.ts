import { watch } from "vue";
import { defineBoot } from "#q-app";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";

export default defineBoot(({ router }) => {
  let restored = false;

  // logout, or a token the server no longer accepts: the next user who logs
  // in this tab must not see the channels and messages of the previous one
  const auth = useAuthStore();
  watch(
    () => auth.isLoggedIn,
    isLoggedIn => {
      if (!isLoggedIn) {
        useChatStore().reset();
      }
    }
  );

  router.beforeEach(async to => {
    const auth = useAuthStore();

    if (!restored) {
      restored = true;
      await auth.fetchMe();
    }

    const requiresAuth = to.matched.some(r => r.meta.requiresAuth);
    const guestOnly = to.matched.some(r => r.meta.guestOnly);

    if (requiresAuth && !auth.isLoggedIn) {
      return { path: "/auth/login", query: { redirect: to.fullPath } };
    }
    if (guestOnly && auth.isLoggedIn) {
      return { path: "/channels" };
    }
  });
});
