<template>
  <div class="command-line q-px-md q-pb-sm">
    <!-- Command suggestions while the user types "/..." -->
    <div v-if="showSuggestions" class="suggestions q-mb-xs">
      <q-list ref="suggestionList" dense class="suggestion-items">
        <q-item
          v-for="(command, i) in suggestions"
          :key="command.usage"
          clickable
          :active="i === activeIndex"
          active-class="suggestion-active"
          @mouseenter="activeIndex = i"
          @click="pickSuggestion(command.usage)"
        >
          <q-item-section>
            <q-item-label class="text-weight-medium">{{
              command.usage
            }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label caption>{{ command.description }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <div class="suggestion-hint gt-xs">
        <kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>Enter</kbd> or
        <kbd>Tab</kbd> select · <kbd>Esc</kbd> close
      </div>
    </div>

    <q-input
      ref="inputRef"
      v-model="text"
      outlined
      dense
      autogrow
      rounded
      class="command-input"
      :placeholder="placeholder"
      @keydown="onKeydown"
    >
      <template #prepend>
        <q-icon :name="isCommand ? 'terminal' : 'chat'" />
      </template>
      <template #append>
        <q-btn
          flat
          dense
          round
          icon="send"
          color="white"
          aria-label="Send"
          :disable="!canSend"
          @click="submit"
        />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import type { QInput, QList } from "quasar";
import { COMMANDS } from "@/lib/commands";
import { useChatStore } from "@/stores/chat-store";

const props = defineProps<{ channel: string | null }>();
const emit = defineEmits<{ showMembers: [] }>();

const chat = useChatStore();
const router = useRouter();
const inputRef = useTemplateRef<QInput>("inputRef");
const suggestionList = useTemplateRef<QList>("suggestionList");

const text = ref("");
// highlighted suggestion, moved with the arrow keys
const activeIndex = ref(0);
// Esc hides the suggestions until the text changes again
const dismissed = ref(false);

const isCommand = computed(() => text.value.trimStart().startsWith("/"));

// Without an open channel only commands make sense (e.g. /join)
const canSend = computed(
  () => text.value.trim() !== "" && (isCommand.value || props.channel !== null)
);

const placeholder = computed(() =>
  props.channel
    ? `Message ${chat.channelLabel(props.channel)} or type / for commands`
    : "Type /join channelName to get started"
);

// Show suggestions only while the command name itself is being typed
const suggestions = computed(() => {
  const value = text.value.trimStart();
  if (!value.startsWith("/") || value.includes(" ")) {
    return [];
  }
  return COMMANDS.filter(command => command.usage.startsWith(value));
});

function pickSuggestion(usage: string) {
  // "/join channelName [private]" -> "/join "
  text.value = `${usage.split(" ")[0]} `;
  inputRef.value?.focus();
}

// Enter sends, Shift+Enter inserts a new line
function onEnter(event: KeyboardEvent) {
  if (event.shiftKey) {
    return;
  }
  event.preventDefault();
  void submit();
}

async function submit() {
  if (!canSend.value) {
    return;
  }
  const value = text.value.trim();
  text.value = "";

  if (!value.startsWith("/")) {
    // canSend guarantees a channel is open for plain messages
    chat.sendMessage(props.channel!, value);
    return;
  }

  const result = chat.runCommand(value, props.channel);
  if (result.showMembers) {
    emit("showMembers");
  }
  if (result.navigateTo) {
    await router.push(result.navigateTo);
  }
}
</script>

<style scoped>
.suggestions {
  background: #2f3572;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  max-height: 240px;
  overflow-y: auto;
}

.command-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.06);
}

/* 16px stops iOS Safari from zooming in on focus */
.command-input :deep(textarea) {
  font-size: 16px;
  max-height: 120px;
}
</style>
