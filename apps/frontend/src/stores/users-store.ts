import { defineStore } from "pinia";
import { ref } from "vue";
import type { PublicProfile } from "@/types/api";
import { client } from "@/lib/client";

// Short profiles of other users, loaded when the UI needs one
export const useUsersStore = defineStore("users", () => {
  // user id -> last loaded profile, shown while a fresh one is loading
  const profiles = ref<Record<string, PublicProfile>>({});

  async function fetchProfile(id: string): Promise<PublicProfile> {
    const result = await client.api.users.show({ params: { id } });
    profiles.value[id] = result.data;
    return result.data;
  }

  return { profiles, fetchProfile };
});
