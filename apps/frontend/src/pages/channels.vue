<template>
  <!-- "lFf": the drawer owns the bottom-left corner, so the command line
       footer sits next to the channel list instead of under it -->
  <q-layout view="hHh LpR lFf" class="bg-grey-1">
    <q-header bordered class="bg-white text-dark">
      <q-toolbar>
        <!-- The only way to hide/show the channel list (like Telegram / Claude web) -->
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Toggle channel list"
          @click="drawerOpen = !drawerOpen"
        />

        <q-toolbar-title v-if="channel" class="row items-center no-wrap">
          <q-icon
            :name="channel.isPrivate ? 'lock' : 'tag'"
            size="22px"
            class="q-mr-xs"
          />
          <span class="ellipsis">{{ channel.name }}</span>
          <q-badge
            v-if="chat.isAdmin(channel)"
            color="amber"
            text-color="dark"
            label="admin"
            class="q-ml-sm"
          />
        </q-toolbar-title>
        <q-toolbar-title v-else class="text-weight-bold"
          >crispy-disco</q-toolbar-title
        >

        <q-btn
          v-if="channel"
          flat
          dense
          round
          icon="group"
          aria-label="Members"
          @click="membersOpen = true"
        >
          <q-tooltip>Members (/list)</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      show-if-above
      bordered
      :width="280"
      class="bg-white"
    >
      <div class="column fit no-wrap">
        <div class="col scroll">
          <ChannelList />
        </div>
        <UserStatusMenu />
      </div>
    </q-drawer>

    <!-- The command line is a fixed element of the app, visible on every chat screen -->
    <q-footer bordered class="bg-grey-1 text-dark">
      <TypingIndicator v-if="channel" :key="channel.name" />
      <div v-else class="typing-placeholder" />
      <CommandLine
        :channel="channel?.name ?? null"
        @show-members="membersOpen = true"
      />
    </q-footer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <MembersDialog
      v-if="channel"
      v-model="membersOpen"
      :channel="channel.name"
    />
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { useChatStore } from "@/stores/chat-store";
import ChannelList from "@/components/chat/ChannelList.vue";
import UserStatusMenu from "@/components/chat/UserStatusMenu.vue";
import TypingIndicator from "@/components/chat/TypingIndicator.vue";
import CommandLine from "@/components/chat/CommandLine.vue";
import MembersDialog from "@/components/chat/MembersDialog.vue";

const $q = useQuasar();
const route = useRoute();
const chat = useChatStore();

const drawerOpen = ref(false);
const membersOpen = ref(false);

// The open channel, only if the user is actually a member of it
const channel = computed(() => {
  const name = "name" in route.params ? String(route.params.name) : null;
  const found = name ? chat.findChannel(name) : undefined;
  return found && !found.invited ? found : null;
});

// On small screens the drawer covers the chat: show it on the welcome
// screen and hide it once a channel is opened. Desktop keeps it as is.
watch(
  () => route.path,
  path => {
    if ($q.screen.lt.md) {
      drawerOpen.value = path === "/channels";
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.typing-placeholder {
  height: 22px;
}
</style>
