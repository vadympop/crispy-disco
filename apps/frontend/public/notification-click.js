// Runs inside the generated service worker of the PWA build, loaded through
// quasar.config.ts > pwa > extendPWAGenerateSWOptions > importScripts.
// Clicking a message notification opens its channel: an open window of the
// app gets focused and is told which channel (src/boot/notifications.ts),
// without one a new window opens at the channel.
// Adapted from https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/channels";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(windows => {
        const open = windows[0];
        if (open) {
          open.postMessage({ type: "open-channel", url });
          return open.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
