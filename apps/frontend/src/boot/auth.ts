import { defineBoot } from "#q-app";
import { useAuthStore } from "@/stores/auth-store";

export default defineBoot(({ router }) => {
  let restored = false;

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
