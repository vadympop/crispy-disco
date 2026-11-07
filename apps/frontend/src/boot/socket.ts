import { watch } from "vue";
import { defineBoot } from "#q-app";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";

export default defineBoot(() => {
  const auth = useAuthStore();

  // Offline stops message delivery: the socket is closed, and the chat store
  // catches up with ?after=<cursor> once it is connected again.
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
});
