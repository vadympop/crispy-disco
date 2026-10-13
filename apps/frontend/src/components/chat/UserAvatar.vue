<template>
  <q-avatar :size="size" text-color="white" :class="avatarClass">
    <img v-if="avatarUrl" :src="avatarUrl" :alt="nickName" />
    <template v-else>{{ nickName.charAt(0).toUpperCase() }}</template>
    <slot />
  </q-avatar>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useChatStore } from "@/stores/chat-store";

const props = withDefaults(
  defineProps<{
    nickName: string;
    size?: string;
    // a picture that isn't saved yet (preview in the settings dialog)
    src?: string | null;
  }>(),
  { size: "36px", src: null }
);

const chat = useChatStore();

// a preview is always of me, even while the nickname is being edited
const isMe = computed(
  () => props.src !== null || props.nickName === chat.me.nickName
);

const avatarUrl = computed(() => {
  if (props.src !== null) {
    return props.src;
  }
  const user = isMe.value ? chat.me : chat.findUser(props.nickName);
  return user?.avatarUrl;
});

const avatarClass = computed(() =>
  isMe.value ? "avatar-own" : "avatar-other"
);
</script>

<style scoped>
.avatar-own {
  background: #252a5c;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.avatar-other {
  background: rgba(255, 255, 255, 0.18);
}
</style>
