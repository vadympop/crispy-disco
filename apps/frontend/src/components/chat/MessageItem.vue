<template>
  <div
    v-touch-hold="showPicker"
    class="message row no-wrap q-px-md q-py-xs"
    :class="{ 'message-mention': mentionsMe }"
    @mouseenter="schedulePicker"
    @mouseleave="hidePicker"
  >
    <transition name="picker">
      <div v-if="pickerVisible" class="reaction-picker row no-wrap">
        <q-btn
          v-for="reaction in REACTIONS"
          :key="reaction"
          flat
          round
          dense
          class="reaction-option"
          :class="{
            'reaction-option-mine': chat.hasReacted(message, reaction)
          }"
          :aria-label="reaction"
          @click="react(reaction)"
          >{{ REACTION_EMOJI[reaction] }}</q-btn
        >
      </div>
    </transition>

    <UserAvatar
      :nick-name="message.author.nickname"
      :src="message.author.avatarUrl"
      class="author q-mr-sm q-mt-xs"
    >
      <UserProfileMenu
        :nick-name="message.author.nickname"
        :user-id="message.author.id"
      />
    </UserAvatar>

    <div class="col" style="min-width: 0">
      <div class="row items-baseline q-gutter-x-sm">
        <span class="author author-nick text-weight-bold"
          >{{ message.author.nickname }}
          <UserProfileMenu
            :nick-name="message.author.nickname"
            :user-id="message.author.id"
          />
        </span>
        <span class="text-caption message-time">{{ time }}</span>
      </div>

      <div class="message-text">
        <template v-for="(part, i) in parts" :key="i">
          <span
            v-if="part.startsWith('@')"
            class="mention cursor-pointer"
            :class="{ 'mention-me': part === `@${auth.nickname}` }"
            title="Copy nickname"
            @click="copyNickname(part)"
            >{{ part }}</span
          >
          <template v-else>{{ part }}</template>
        </template>
      </div>

      <div v-if="message.reactions.length > 0" class="row q-gutter-xs q-mt-xs">
        <q-chip
          v-for="group in message.reactions"
          :key="group.reaction"
          dense
          clickable
          class="reaction-chip q-ma-none"
          :class="{
            'reaction-chip-mine': chat.hasReacted(message, group.reaction)
          }"
          @click="react(group.reaction)"
        >
          {{ REACTION_EMOJI[group.reaction] }}
          <span class="q-ml-xs">{{ group.userIds.length }}</span>
        </q-chip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { Notify, copyToClipboard, date } from "quasar";
import type { Reaction } from "@cisco-disco/backend/realtime";
import { useChatStore } from "@/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";
import type { Message } from "@/types/api";
import { mentions, splitMentions } from "@/lib/mentions";
import { REACTIONS, REACTION_EMOJI } from "@/lib/reactions";
import UserAvatar from "@/components/chat/UserAvatar.vue";
import UserProfileMenu from "@/components/chat/UserProfileMenu.vue";

const props = defineProps<{ message: Message }>();

const chat = useChatStore();
const auth = useAuthStore();

const parts = computed(() => splitMentions(props.message.content));

const mentionsMe = computed(() =>
  mentions(props.message.content, auth.nickname)
);

// "@ed" -> "ed", ready to paste into /invite, /kick, ...
async function copyNickname(mention: string) {
  const nickname = mention.slice(1);
  try {
    await copyToClipboard(nickname);
    Notify.create({ type: "positive", message: `Copied ${nickname}` });
  } catch {
    Notify.create({ type: "negative", message: "Could not copy the nickname" });
  }
}

const PICKER_DELAY_MS = 400;

const pickerVisible = ref(false);
let pickerTimer: ReturnType<typeof setTimeout> | undefined;

function showPicker() {
  pickerVisible.value = true;
}

function schedulePicker() {
  if (!window.matchMedia("(hover: hover)").matches) {
    return;
  }
  clearTimeout(pickerTimer);
  pickerTimer = setTimeout(showPicker, PICKER_DELAY_MS);
}

function hidePicker() {
  clearTimeout(pickerTimer);
  pickerVisible.value = false;
}

onBeforeUnmount(() => clearTimeout(pickerTimer));

function react(reaction: Reaction) {
  hidePicker();
  void chat.toggleReaction(props.message, reaction);
}

const time = computed(() =>
  props.message.createdAt
    ? date.formatDate(props.message.createdAt, "HH:mm")
    : ""
);
</script>

<style scoped>
.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.message {
  position: relative;
}

.message:hover {
  background: rgba(255, 255, 255, 0.04);
}

.reaction-picker {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-md);
  z-index: 1;
  padding: 2px;
  background: #252a5c;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
}

.reaction-picker .reaction-option {
  font-size: 14px;
  width: 26px;
  height: 26px;
  min-width: 0;
  min-height: 0;
  transition: transform 0.1s;
}

.reaction-option:hover {
  transform: scale(1.2);
}

.reaction-option-mine {
  background: rgba(201, 205, 255, 0.25);
}

.picker-enter-active,
.picker-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.95);
}

.reaction-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid transparent;
  color: inherit;
}

.reaction-chip-mine {
  background: rgba(201, 205, 255, 0.2);
  border-color: #c9cdff;
}

.author {
  cursor: pointer;
}

.author-nick:hover {
  text-decoration: underline;
}

.message-time {
  opacity: 0.6;
}

.mention {
  color: #c9cdff;
  font-weight: 600;
}

.mention-me {
  color: #252a5c;
  background: #ffe27a;
  border-radius: var(--radius-sm);
  padding: 0 var(--space-xs);
}

.message-mention,
.message-mention:hover {
  background: rgba(255, 226, 122, 0.12);
  border-left: 3px solid #ffe27a;
}
</style>
