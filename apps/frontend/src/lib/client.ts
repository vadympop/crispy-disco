import { createTuyau } from "@tuyau/core/client";
import { registry } from "@cisco-disco/backend/registry";
import { LOCALSTORAGE_KEYS } from '@/lib/storage-keys'

export const client = createTuyau({
  baseUrl: import.meta.env.API_URL,
  registry,
  headers: { Accept: "application/json" },
  hooks: {
    beforeRequest: [
      request => {
        const token = localStorage.getItem(LOCALSTORAGE_KEYS.authToken)
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      }
    ],
    beforeError: [
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem(LOCALSTORAGE_KEYS.authToken)
        }

        return error
      }
    ]
  }
});
