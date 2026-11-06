import { defineBoot } from "#q-app";
import { Notify } from "quasar";
import { TuyauHTTPError, TuyauNetworkError } from "@tuyau/core/client";
import { useAuthStore } from "@/stores/auth-store";

function getErrorMessage(error: TuyauHTTPError): string {
  const body = error.response as
    | { errors?: { message: string }[]; message?: string }
    | undefined;

  return (
    body?.errors?.[0]?.message ??
    body?.message ??
    `Request failed (${error.status})`
  );
}

export default defineBoot(({ app, router }) => {
  function handleApiError(error: unknown): boolean {
    if (error instanceof TuyauNetworkError) {
      Notify.create({
        type: "negative",
        message: "Can't reach the server. Check your connection."
      });
      return true;
    }
    if (!(error instanceof TuyauHTTPError)) return false;

    if (error.status === 401) {
      // the beforeError hook in lib/client.ts already removed the token
      useAuthStore().clearSession();
      const current = router.currentRoute.value;
      if (!current.path.startsWith("/auth")) {
        Notify.create({
          type: "warning",
          message: "Your session has expired. Please log in again."
        });
        void router.push({
          path: "/auth/login",
          query: { redirect: current.fullPath }
        });
      }
      return true;
    }

    Notify.create({ type: "negative", message: getErrorMessage(error) });
    return true;
  }

  // https://vuejs.org/api/application.html#app-config-errorhandler
  app.config.errorHandler = error => {
    if (!handleApiError(error)) console.error(error);
  };

  // promises nobody awaited or caught
  window.addEventListener("unhandledrejection", event => {
    if (handleApiError(event.reason)) event.preventDefault();
  });
});
