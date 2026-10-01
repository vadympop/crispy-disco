<template>
  <div
    class="message row no-wrap q-px-md q-py-xs"
    :class="{ 'message-mention': mentionsMe }"
  >
    <q-avatar
      size="36px"
      class="q-mr-sm q-mt-xs"
      :color="isOwn ? 'primary' : 'blue-grey-5'"
      text-color="white"
    >
      {{ message.authorNick.charAt(0).toUpperCase() }}
    </q-avatar>

    <div class="col" style="min-width: 0">
      <div class="row items-baseline q-gutter-x-sm">
        <span class="text-weight-bold">{{ message.authorNick }}</span>
        <span class="text-caption text-grey-6">{{ time }}</span>
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

const props = defineProps<{ message: Message }>();

const chat = useChatStore();

const isOwn = computed(() => props.message.authorNick === chat.me.nickName);

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

.mention {
  color: #505ba3;
  font-weight: 600;
}

.mention-me {
  background: rgba(242, 192, 55, 0.35);
  border-radius: 4px;
  padding: 0 2px;
}

.message-mention {
  background: rgba(242, 192, 55, 0.12);
  border-left: 3px solid #f2c037;
}
</style>
