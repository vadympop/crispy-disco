import { watch } from "vue";
import { defineBoot } from "#q-app";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";

export default defineBoot(() => {
  const auth = useAuthStore();

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
