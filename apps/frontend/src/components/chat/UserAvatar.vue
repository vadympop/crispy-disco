<template>
  <q-avatar :size="size" text-color="white" :class="avatarClass">
    <img v-if="imageSrc" :src="imageSrc" :alt="nickName" />
    <template v-else>{{ nickName.charAt(0).toUpperCase() }}</template>
    <slot />
  </q-avatar>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { avatarSrc } from "@/lib/avatar";
import { useAuthStore } from "@/stores/auth-store";

const props = withDefaults(
  defineProps<{
    nickName: string;
    size?: string;
    // the user's avatarUrl from the API, or a data: url while previewing
    src?: string | null;
    // the settings dialog shows me while the nickname is being edited
    own?: boolean;
  }>(),
  { size: "36px", src: null, own: false }
);

const auth = useAuthStore();

const isMe = computed(() => props.own || props.nickName === auth.nickname);

// a data: url stays as it is, an API path gets the API host
const imageSrc = computed(() => avatarSrc(props.src));

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
