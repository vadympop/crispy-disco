<template>
  <q-dialog v-model="open">
    <q-card class="members-card">
      <q-card-section class="row items-center">
        <div class="text-h6 col">Members of #{{ channel }}</div>
        <q-btn v-close-popup flat round dense icon="close" aria-label="Close" />
      </q-card-section>

      <q-list class="scroll" style="max-height: 60vh">
        <q-item v-for="member in members" :key="member.nickName">
          <q-item-section avatar>
            <q-avatar color="blue-grey-5" text-color="white" size="36px">
              {{ member.nickName.charAt(0).toUpperCase() }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ member.nickName }}
              <q-badge
                v-if="member.nickName === adminNick"
                color="amber"
                text-color="dark"
                label="admin"
                class="q-ml-xs"
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
import { computed } from "vue";
import { useChatStore } from "@/stores/chat-store";
import { statusOption } from "@/lib/status";

const props = defineProps<{ channel: string }>();
const open = defineModel<boolean>({ required: true });

const chat = useChatStore();

const members = computed(() => chat.membersOf(props.channel));
const adminNick = computed(() => chat.findChannel(props.channel)?.adminNick);
</script>

<style scoped>
.members-card {
  width: 100%;
  max-width: 420px;
}
</style>
