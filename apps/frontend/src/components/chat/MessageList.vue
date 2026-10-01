<template>
  <div ref="scrollArea" class="message-scroll scroll">
    <!-- Quasar picks the closest ".scroll" parent (the div above) as the scroll target -->
    <q-infinite-scroll reverse :offset="250" @load="onLoad">
      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="32px" />
        </div>
      </template>

      <div v-if="!hasMore" class="text-center text-caption text-grey-6 q-py-md">
        This is the beginning of #{{ channel }}
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

// Load the newest page right away, older pages come from the infinite scroll
if (!chat.messagesByChannel[props.channel]) {
  hasMore.value = chat.loadOlder(props.channel);
}

const messages = computed(() => chat.messagesByChannel[props.channel] ?? []);

function onLoad(_index: number, done: (stop?: boolean) => void) {
  // fake network delay so the loading spinner is visible
  setTimeout(() => {
    hasMore.value = chat.loadOlder(props.channel);
    done(!hasMore.value);
  }, 400);
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
/* the parent gives the height (flex "col"), min-height: 0 lets it shrink */
.message-scroll {
  min-height: 0;
  overflow-y: auto;
}
</style>
