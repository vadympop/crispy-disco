import { watch } from "vue";
import { defineBoot } from "#q-app";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";

export default defineBoot(({ router }) => {
  const auth = useAuthStore();
  const chat = useChatStore();

  watch(
    () => auth.isLoggedIn && auth.me?.status !== "offline",
    shouldConnect => {
      if (shouldConnect) {
        socket.connect();
      } else {
        socket.disconnect();
      }
    },
    { immediate: true }
  );

  // Leaves the page of a channel I am no longer in
  function leaveChannelPage(name: string | undefined) {
    const params = router.currentRoute.value.params;
    if (name && "name" in params && params.name === name) {
      void router.push("/channels");
    }
  }

  // The handlers are registered once, socket.io keeps them across reconnects
  socket.on("channel:invited", channel => chat.onChannelInvited(channel));
  socket.on("channel:added", channel => chat.onChannelAdded(channel));
  socket.on("channel:removed", ({ channelId, reason }) =>
    leaveChannelPage(chat.onChannelRemoved(channelId, reason))
  );
  socket.on("channel:deleted", ({ channelId }) =>
    leaveChannelPage(chat.onChannelDeleted(channelId))
  );
});
