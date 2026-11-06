<template>
  <q-dialog v-model="open" @before-show="loadMembers">
    <q-card flat class="dialog-card q-pb-sm">
      <q-card-section class="row items-center">
        <div class="text-h6 col ellipsis"
          >Members of {{ chat.channelLabel(channel) }}</div
        >
        <q-btn v-close-popup flat round dense icon="close" aria-label="Close" />
      </q-card-section>

      <div v-if="isLoading" class="row justify-center q-pa-md">
        <q-spinner size="28px" />
      </div>
      <q-list v-else class="scroll" style="max-height: 60vh">
        <q-item v-for="member in members" :key="member.id" clickable>
          <UserProfileMenu
            :nick-name="member.nickname"
            :user-id="member.id"
            @navigated="open = false"
          />
          <q-item-section avatar>
            <UserAvatar :nick-name="member.nickname" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ member.nickname }}
              <q-badge
                v-if="member.id === creatorId"
                text-color="dark"
                class="admin-badge q-ml-xs"
                label="admin"
              />
            </q-item-label>
            <q-item-label caption>
              {{ member.firstName }} {{ member.lastName }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center no-wrap text-caption">
              <q-icon
                name="circle"
                size="10px"
                class="q-mr-xs"
                :style="{ color: statusOption(member.status).color }"
              />
              {{ statusOption(member.status).label }}
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { PublicProfile } from "@/types/api";
import { useChatStore } from "@/stores/chat-store";
import { statusOption } from "@/lib/status";
import UserAvatar from "@/components/chat/UserAvatar.vue";
import UserProfileMenu from "@/components/chat/UserProfileMenu.vue";

const props = defineProps<{ channel: string }>();
const open = defineModel<boolean>({ required: true });

const chat = useChatStore();

const members = ref<PublicProfile[]>([]);
const isLoading = ref(false);

// loaded on every open, members join and leave all the time
async function loadMembers() {
  isLoading.value = true;
  try {
    members.value = await chat.fetchMembers(props.channel);
  } finally {
    isLoading.value = false;
  }
}
const creatorId = computed(() => chat.findChannel(props.channel)?.creator.id);
</script>

<style scoped>
.admin-badge {
  background: #ffe27a;
}
</style>
