<template>
  <div class="splash fixed-full column flex-center">
    <DiscoBallLogo :size="72" />
    <div class="splash-title text-h5 text-weight-bold q-mt-md">
      crispy-disco
    </div>
    <q-spinner-dots color="white" size="32px" class="q-mt-lg" />
  </div>
</template>

<script setup lang="ts">
import DiscoBallLogo from "@/components/DiscoBallLogo.vue";
</script>

<style scoped>
.splash {
  /* same background as the chat screens, which the user usually lands on */
  background: #252a5c;
  color: white;
  z-index: 9999;
}
</style>
