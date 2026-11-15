import { AppVisibility, Notify } from "quasar";
import type { Router } from "vue-router";
import type { Channel, Message, User } from "@/types/api";
import { avatarSrc } from "@/lib/avatar";
import { mentions } from "@/lib/mentions";
import { LOCALSTORAGE_KEYS } from "@/lib/storage-keys";

// Browser notifications for new messages, shown only while the app is
// in the background. https://developer.mozilla.org/en-US/docs/Web/API/Notification

const SNIPPET_LENGTH = 100;
const APP_ICON = "/icons/web-app-manifest-192x192.png";

export function notificationsSupported(): boolean {
  return "Notification" in window;
}

export function notificationPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : "denied";
}

// Browsers only allow asking after a click, so call it from a click handler
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) {
    return "denied";
  }
  return Notification.requestPermission();
}

// Asks once, on the first visit of the chat, whether to turn them on.
// Later they can be turned on in the settings dialog.
export function offerNotifications() {
  // also "denied" when the browser has no notifications
  if (notificationPermission() !== "default") {
    return;
  }
  // localStorage can be blocked (private mode), then it isn't offered
  try {
    if (localStorage.getItem(LOCALSTORAGE_KEYS.notificationsOffered)) {
      return;
    }
    localStorage.setItem(LOCALSTORAGE_KEYS.notificationsOffered, "1");
  } catch {
    return;
  }

  Notify.create({
    message:
      "Get notified about new messages while the app is in the background?",
    timeout: 0,
    actions: [
      {
        label: "Enable",
        color: "white",
        handler: () => void requestNotificationPermission()
      },
      { label: "Not now", color: "white" }
    ]
  });
}

// The rules of the assignment: not my own message, the app is not visible
// (https://quasar.dev/quasar-plugins/app-visibility), no notifications in
// DND, and with "mentions only" just the messages with my @nickname.
// Offline needs no rule: the socket is disconnected then.
export function shouldNotify(message: Message, me: User | null): boolean {
  if (!me || message.author.id === me.id) {
    return false;
  }
  if (AppVisibility.appVisible || notificationPermission() !== "granted") {
    return false;
  }
  if (me.status === "dnd") {
    return false;
  }
  return !me.notifyMentionsOnly || mentions(message.content, me.nickname);
}

function snippet(content: string): string {
  return content.length > SNIPPET_LENGTH
    ? `${content.slice(0, SNIPPET_LENGTH)}…`
    : content;
}

export async function showMessageNotification(
  message: Message,
  channel: Channel,
  router: Router
) {
  const sender = message.author.nickname;
  const title = channel.isDirect ? sender : `${sender} in #${channel.name}`;
  const url = `/channels/${encodeURIComponent(channel.name)}`;
  const options: NotificationOptions = {
    body: snippet(message.content),
    icon: avatarSrc(message.author.avatarUrl) ?? APP_ICON,
    // one notification per channel, a newer message replaces the older one
    tag: channel.id,
    // read by the service worker click handler (public/notification-click.js)
    data: { url }
  };

  // With a service worker (the PWA build) only this works, e.g. Chrome on
  // Android throws on new Notification(). The click is then handled there.
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration) {
    await registration.showNotification(title, options);
    return;
  }

  const notification = new Notification(title, options);
  notification.onclick = () => {
    window.focus();
    void router.push(url);
    notification.close();
  };
}
