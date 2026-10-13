<template>
  <div
    class="message row no-wrap q-px-md q-py-xs"
    :class="{ 'message-mention': mentionsMe }"
  >
    <UserAvatar :nick-name="message.authorNick" class="author q-mr-sm q-mt-xs">
      <UserProfileMenu :nick-name="message.authorNick" />
    </UserAvatar>

    <div class="col" style="min-width: 0">
      <div class="row items-baseline q-gutter-x-sm">
        <span class="author author-nick text-weight-bold"
          >{{ message.authorNick }}
          <UserProfileMenu :nick-name="message.authorNick" />
        </span>
        <span class="text-caption message-time">{{ time }}</span>
      </div>

      <div class="message-text">
        <template v-for="(part, i) in parts" :key="i">
          <span
            v-if="part.startsWith('@')"
            class="mention"
            :class="{ 'mention-me': part === `@${chat.me.nickName}` }"
            >{{ part }}</span
          >
          <template v-else>{{ part }}</template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { date } from "quasar";
import { useChatStore } from "@/stores/chat-store";
import type { Message } from "@/types/chat";
import UserAvatar from "@/components/chat/UserAvatar.vue";
import UserProfileMenu from "@/components/chat/UserProfileMenu.vue";

const props = defineProps<{ message: Message }>();

const chat = useChatStore();

// Splitting with a capture group keeps the "@nick" pieces in the result:
// "hi @ed !" -> ["hi ", "@ed", " !"]
const parts = computed(() =>
  props.message.text.split(/(@[\w.-]+)/).filter(part => part !== "")
);

const mentionsMe = computed(() => parts.value.includes(`@${chat.me.nickName}`));

const time = computed(() => date.formatDate(props.message.createdAt, "HH:mm"));
</script>

<style scoped>
.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.message:hover {
  background: rgba(255, 255, 255, 0.04);
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
  border-radius: 4px;
  padding: 0 2px;
}

.message-mention,
.message-mention:hover {
  background: rgba(255, 226, 122, 0.12);
  border-left: 3px solid #ffe27a;
}
</style>
