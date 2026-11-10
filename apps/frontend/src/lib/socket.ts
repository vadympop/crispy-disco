import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "@cisco-disco/backend/realtime";
import { LOCALSTORAGE_KEYS } from "@/lib/storage-keys";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.API_URL,
  {
    autoConnect: false,
    // Same ngrok warning bypass as in client.ts, for the HTTP polling transport.
    // https://socket.io/docs/v4/client-options/#extraheaders
    extraHeaders: { "ngrok-skip-browser-warning": "true" },
    // https://socket.io/docs/v4/client-options/#auth
    auth: callback =>
      callback({ token: localStorage.getItem(LOCALSTORAGE_KEYS.authToken) })
  }
);
