<template>
  <router-view />

  <Transition name="splash-fade">
    <SplashScreen v-if="auth.isRestoring" />
  </Transition>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth-store";
import SplashScreen from "@/components/SplashScreen.vue";

const auth = useAuthStore();
</script>

<style>
.splash-fade-leave-active {
  transition: opacity 0.3s ease;
}

.splash-fade-leave-to {
  opacity: 0;
}
</style>
