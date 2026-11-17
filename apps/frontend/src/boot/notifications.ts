import { defineBoot } from "#q-app";

// In the PWA build a notification click is handled by the service worker
// (public/notification-click.js). It focuses this window and asks it to open
// the channel, so the app navigates without a full reload.
// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/message_event
export default defineBoot(({ router }) => {
  navigator.serviceWorker?.addEventListener("message", event => {
    const data = event.data as { type?: string; url?: unknown } | null;
    if (data?.type === "open-channel" && typeof data.url === "string") {
      void router.push(data.url);
    }
  });
});
