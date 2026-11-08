<template>
  <div ref="scrollArea" class="message-scroll scroll">
    <!-- Quasar picks the closest ".scroll" parent (the div above) as the scroll target -->
    <q-infinite-scroll reverse :offset="250" @load="onLoad">
      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="white" size="32px" />
        </div>
      </template>

      <div
        v-if="!hasMore"
        class="text-center text-caption channel-start q-py-md"
      >
        This is the beginning of {{ beginning }}
      </div>

      <MessageItem
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />
    </q-infinite-scroll>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useChatStore } from "@/stores/chat-store";
import MessageItem from "@/components/chat/MessageItem.vue";

const props = defineProps<{ channel: string }>();

const chat = useChatStore();
const scrollArea = useTemplateRef<HTMLDivElement>("scrollArea");
const hasMore = ref(true);

const beginning = computed(() => {
  const label = chat.channelLabel(props.channel);
  return chat.findChannel(props.channel)?.isDirect
    ? `your chat with ${label}`
    : label;
});

const messages = computed(() => chat.messagesOf(props.channel));

// The infinite scroll also calls this on mount, while the list is still
// empty, so the newest page comes from here too
async function onLoad(_index: number, done: (stop?: boolean) => void) {
  // a failed request stops the scroll (no retry loop), the error is
  // shown by the api-errors boot file
  let stop = true;
  try {
    hasMore.value = await chat.loadOlder(props.channel);
    stop = !hasMore.value;
  } finally {
    done(stop);
  }
}

async function scrollToBottom() {
  await nextTick();
  const el = scrollArea.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}

onMounted(scrollToBottom);

// A new message at the end (not older ones at the start) -> follow it
watch(
  () => messages.value.at(-1)?.id,
  () => void scrollToBottom()
);
</script>

<style scoped>
.channel-start {
  opacity: 0.6;
}

.message-scroll {
  min-height: 0;
  overflow-y: auto;
}
</style>
