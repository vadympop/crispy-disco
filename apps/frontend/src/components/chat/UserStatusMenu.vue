<template>
  <q-item clickable class="status-bar">
    <q-item-section avatar>
      <q-avatar color="primary" text-color="white" size="36px">
        {{ chat.me.nickName.charAt(0).toUpperCase() }}
        <q-badge
          floating
          rounded
          class="status-dot"
          :style="{ background: current.color }"
        />
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <q-item-label class="text-weight-bold">{{
        chat.me.nickName
      }}</q-item-label>
      <q-item-label caption>{{ current.label }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-icon name="settings" />
    </q-item-section>

    <q-menu anchor="top left" self="bottom left" :offset="[0, 8]">
      <q-list style="min-width: 240px">
        <q-item-label header>Status</q-item-label>
        <q-item
          v-for="option in STATUS_OPTIONS"
          :key="option.value"
          v-close-popup
          clickable
          :active="chat.me.status === option.value"
          @click="chat.setStatus(option.value)"
        >
          <q-item-section avatar>
            <q-icon
              name="circle"
              size="14px"
              :style="{ color: option.color }"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ option.label }}</q-item-label>
            <q-item-label caption>{{ option.hint }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item tag="label">
          <q-item-section>
            <q-item-label>Notify only for mentions</q-item-label>
            <q-item-label caption
              >Ignore messages without @{{ chat.me.nickName }}</q-item-label
            >
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="chat.notifyMentionsOnly" />
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item v-close-popup clickable class="text-negative" to="/">
          <q-item-section avatar><q-icon name="logout" /></q-item-section>
          <q-item-section>Log out</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useChatStore } from "@/stores/chat-store";
import { STATUS_OPTIONS, statusOption } from "@/lib/status";

const chat = useChatStore();

const current = computed(() => statusOption(chat.me.status));
</script>

<style scoped>
.status-bar {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.status-dot {
  width: 12px;
  height: 12px;
  min-height: 0;
  padding: 0;
  border: 2px solid white;
  top: auto;
  bottom: -2px;
  right: -2px;
}
</style>
