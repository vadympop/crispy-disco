import { defineStore } from "pinia";
import { ref } from "vue";
import type { PublicProfile, UserStats } from "@/types/api";
import { client } from "@/lib/client";

// Short profiles of other users, loaded when the UI needs one
export const useUsersStore = defineStore("users", () => {
  // user id -> last loaded profile, shown while a fresh one is loading
  const profiles = ref<Record<string, PublicProfile>>({});
  // user id -> last loaded stats, the same way
  const stats = ref<Record<string, UserStats>>({});

  async function fetchProfile(id: string): Promise<PublicProfile> {
    const result = await client.api.users.show({ params: { id } });
    profiles.value[id] = result.data;
    return result.data;
  }

  // Messages and channels I share with that user (or all mine, for myself)
  async function fetchStats(id: string): Promise<UserStats> {
    const result = await client.api.users.stats({ params: { id } });
    stats.value[id] = result.data;
    return result.data;
  }

  return { profiles, stats, fetchProfile, fetchStats };
});
