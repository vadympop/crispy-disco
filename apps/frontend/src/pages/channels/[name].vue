<template>
  <!-- Exact height (not min-height) so MessageList can scroll inside the page -->
  <q-page :style-fn="fitHeight" class="column no-wrap">
    <q-banner
      v-if="chat.me.status === 'offline'"
      dense
      class="bg-grey-3 text-grey-9"
    >
      <template #avatar><q-icon name="cloud_off" /></template>
      You are offline. New messages are not delivered until you go back online.
    </q-banner>

    <template v-if="channel && !channel.invited">
      <MessageList :key="channel.name" :channel="channel.name" class="col" />
    </template>

    <div v-else class="col flex flex-center text-center q-pa-md">
      <div>
        <q-icon name="block" size="64px" color="grey-5" />
        <div class="text-h6 q-mt-sm">You are not a member of #{{ name }}</div>
        <div class="text-grey-7 q-mb-md">
          Use <code>/join {{ name }}</code> or accept an invitation to see its
          messages.
        </div>
        <q-btn
          flat
          no-caps
          color="primary"
          label="Back to channels"
          to="/channels"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useChatStore } from "@/stores/chat-store";
import MessageList from "@/components/chat/MessageList.vue";

const route = useRoute("/channels/[name]");
const chat = useChatStore();

const name = computed(() => route.params.name);
const channel = computed(() => chat.findChannel(name.value));

// Quasar passes the header+footer offset; the page fills exactly the rest
function fitHeight(offset: number, height: number) {
  return { height: `${height - offset}px` };
}
</script>
