<template>
  <!-- "lFf": the drawer owns the bottom-left corner, so the command line
       footer sits next to the channel list instead of under it -->
  <q-layout view="hHh LpR lFf" class="chat-layout">
    <q-header class="chat-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Toggle channel list"
          @click="drawerOpen = !drawerOpen"
        />

        <q-toolbar-title v-if="channel" class="row items-center no-wrap">
          <UserAvatar
            v-if="channel.directWith"
            :nick-name="channel.directWith"
            size="28px"
            class="q-mr-sm cursor-pointer"
          >
            <UserProfileMenu :nick-name="channel.directWith" />
          </UserAvatar>
          <q-icon
            v-else
            :name="channel.isPrivate ? 'lock' : 'tag'"
            size="22px"
            class="q-mr-xs"
          />
          <span class="ellipsis">{{ chat.channelTitle(channel) }}</span>
          <q-badge
            v-if="chat.isAdmin(channel) && !channel.directWith"
            text-color="dark"
            label="admin"
            class="admin-badge q-ml-sm"
          />
        </q-toolbar-title>

        <q-toolbar-title v-else class="row items-center no-wrap">
          <q-icon name="home" size="22px" class="q-mr-xs" />
          <span>Home</span>
        </q-toolbar-title>

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
      :width="280"
      class="chat-drawer"
    >
      <div class="column fit no-wrap">
        <router-link
          to="/channels"
          class="drawer-brand row items-center no-wrap"
        >
          <DiscoBallLogo :size="30" class="q-mr-sm" />
          <span class="text-subtitle1 text-weight-bold">crispy-disco</span>
        </router-link>
        <div class="col scroll">
          <ChannelList />
        </div>
        <UserStatusMenu />
      </div>
    </q-drawer>

    <!-- The command line is a fixed element of the app, visible on every chat screen -->
    <q-footer class="chat-footer">
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { useChatStore } from "@/stores/chat-store";
import DiscoBallLogo from "@/components/DiscoBallLogo.vue";
import UserAvatar from "@/components/chat/UserAvatar.vue";
import UserProfileMenu from "@/components/chat/UserProfileMenu.vue";
import ChannelList from "@/components/chat/ChannelList.vue";
import UserStatusMenu from "@/components/chat/UserStatusMenu.vue";
import TypingIndicator from "@/components/chat/TypingIndicator.vue";
import CommandLine from "@/components/chat/CommandLine.vue";
import MembersDialog from "@/components/chat/MembersDialog.vue";

const $q = useQuasar();
const route = useRoute();
const chat = useChatStore();

// The chat screens use the landing palette through Quasar's dark mode
// ($dark / $dark-page in quasar.variables.scss), so menus and dialogs match too.
// The root background covers macOS rubber-band overscroll, as on the landing.
const CHAT_BG = "#252a5c";

onMounted(() => {
  $q.dark.set(true);
  document.documentElement.style.backgroundColor = CHAT_BG;
});

onBeforeUnmount(() => {
  $q.dark.set(false);
  document.documentElement.style.backgroundColor = "";
});

const drawerOpen = ref(false);
const membersOpen = ref(false);

// The open channel, only if the user is actually a member of it
const channel = computed(() => {
  const name = "name" in route.params ? String(route.params.name) : null;
  const found = name ? chat.findChannel(name) : undefined;
  return found && !found.invited ? found : null;
});

// On small screens the drawer covers the chat: show it on the welcome
// screen and hide it once a channel is opened
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
.chat-header,
.chat-drawer,
.chat-footer {
  background: #252a5c;
  color: #ffffff;
}

.chat-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.chat-drawer {
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

.chat-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.chat-layout :deep(.q-page-container) {
  background: #505ba3;
}

.drawer-brand {
  padding: 14px 16px;
  color: #ffffff;
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.admin-badge {
  background: #ffe27a;
}

.typing-placeholder {
  height: 22px;
}
</style>
