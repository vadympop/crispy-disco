<template>
  <!-- Fixed height so the command line doesn't jump when someone starts typing -->
  <div class="typing-indicator q-px-md text-caption text-grey-8">
    <template v-if="chat.typing.length > 0">
      <q-spinner-dots size="14px" class="q-mr-xs" />
      <template v-for="(draft, i) in chat.typing" :key="draft.nickName">
        <span v-if="i > 0">, </span>
        <span class="typing-nick">
          {{ draft.nickName }}
          <!-- Clicking the nick shows what they are writing, updated live -->
          <q-menu anchor="top left" self="bottom left" :offset="[0, 6]">
            <q-card class="draft-card">
              <q-card-section class="q-pb-none text-caption text-grey-7">
                {{ draft.nickName }} is writing…
              </q-card-section>
              <q-card-section class="draft-text">
                {{ draft.text }}<span class="caret">|</span>
              </q-card-section>
            </q-card>
          </q-menu>
        </span>
      </template>
      {{ chat.typing.length === 1 ? "is" : "are" }} typing
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useChatStore } from "@/stores/chat-store";

const chat = useChatStore();

// The store fakes other users typing until the backend sends real drafts
let stopTyping: (() => void) | undefined;

onMounted(() => {
  stopTyping = chat.simulateTyping();
});

onUnmounted(() => {
  stopTyping?.();
});
</script>

<style scoped>
.typing-indicator {
  height: 22px;
  line-height: 22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.typing-nick {
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline dotted;
}

.draft-card {
  max-width: 320px;
}

.draft-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.caret {
  animation: blink 1s step-start infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
