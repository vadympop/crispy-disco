import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "@cisco-disco/backend/realtime";
import { LOCALSTORAGE_KEYS } from "@/lib/storage-keys";

// One connection for the whole app, typed with the backend's events.
// src/boot/socket.ts decides when it is connected.
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.API_URL,
  {
    autoConnect: false,
    // read on every (re)connect, so a new login uses the new token
    // https://socket.io/docs/v4/client-options/#auth
    auth: callback =>
      callback({ token: localStorage.getItem(LOCALSTORAGE_KEYS.authToken) })
  }
);
