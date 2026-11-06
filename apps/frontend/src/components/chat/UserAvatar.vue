<template>
  <q-avatar :size="size" text-color="white" :class="avatarClass">
    {{ nickName.charAt(0).toUpperCase() }}
    <slot />
  </q-avatar>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth-store";

const props = withDefaults(
  defineProps<{
    nickName: string;
    size?: string;
    // the settings dialog shows my avatar while the nickname is being edited
    isOwn?: boolean;
  }>(),
  { size: "36px", isOwn: false }
);

const auth = useAuthStore();

const isMe = computed(() => props.isOwn || props.nickName === auth.nickname);

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
