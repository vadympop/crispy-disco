import { defineStore } from "pinia";
import { ref } from "vue";
import type { PublicProfile, UserStats } from "@/types/api";
import { client } from "@/lib/client";
import type { UserStatus } from "@/lib/status";

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

  // a live status from the socket, only kept if the profile was loaded
  function onStatusChanged(id: string, status: UserStatus) {
    const profile = profiles.value[id];
    if (profile) {
      profile.status = status;
    }
  }

  return { profiles, stats, fetchProfile, fetchStats, onStatusChanged };
});
