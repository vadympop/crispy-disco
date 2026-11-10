import { watch } from "vue";
import { defineBoot } from "#q-app";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";

export default defineBoot(({ router }) => {
  let restored = false;

  const auth = useAuthStore();
  watch(
    () => auth.isLoggedIn,
    isLoggedIn => {
      if (!isLoggedIn) {
        useChatStore().reset();

        const current = router.currentRoute.value;
        if (current.matched.some(r => r.meta.requiresAuth)) {
          void router.replace("/");
        }
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
