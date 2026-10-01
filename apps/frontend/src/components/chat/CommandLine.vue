<template>
  <div class="command-line q-px-md q-pb-sm">
    <!-- Command suggestions while the user types "/..." -->
    <q-list
      v-if="suggestions.length > 0"
      dense
      bordered
      class="suggestions q-mb-xs"
    >
      <q-item
        v-for="command in suggestions"
        :key="command.usage"
        clickable
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

    <q-input
      ref="inputRef"
      v-model="text"
      outlined
      dense
      autogrow
      bg-color="white"
      class="command-input"
      :placeholder="placeholder"
      @keydown.enter="onEnter"
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
          color="primary"
          aria-label="Send"
          :disable="!canSend"
          @click="submit"
        />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import type { QInput } from "quasar";
import { COMMANDS } from "@/lib/commands";
import { useChatStore } from "@/stores/chat-store";

const props = defineProps<{ channel: string | null }>();
const emit = defineEmits<{ showMembers: [] }>();

const chat = useChatStore();
const router = useRouter();
const inputRef = useTemplateRef<QInput>("inputRef");

const text = ref("");

const isCommand = computed(() => text.value.trimStart().startsWith("/"));

// Without an open channel only commands make sense (e.g. /join)
const canSend = computed(
  () => text.value.trim() !== "" && (isCommand.value || props.channel !== null)
);

const placeholder = computed(() =>
  props.channel
    ? `Message #${props.channel} or type / for commands`
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
  background: white;
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
}

/* 16px stops iOS Safari from zooming in on focus */
.command-input :deep(textarea) {
  font-size: 16px;
  max-height: 120px;
}
</style>
