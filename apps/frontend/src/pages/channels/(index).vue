<template>
  <q-page padding class="welcome-page">
    <div class="welcome-content">
      <div class="text-h4 text-weight-bold q-mb-xs">
        Welcome, {{ chat.me.firstName }}! 👋
      </div>
      <div class="text-body1 text-grey-8 q-mb-lg">
        Pick a channel on the left, or type
        <code>/join channelName</code> in the command line below.
      </div>

      <q-card v-if="invites.length > 0" flat bordered class="q-mb-md">
        <q-card-section class="text-subtitle1 text-weight-bold">
          <q-icon name="mail" color="warning" class="q-mr-xs" />
          Pending invitations
        </q-card-section>
        <q-list separator>
          <q-item v-for="channel in invites" :key="channel.name">
            <q-item-section>
              <q-item-label>#{{ channel.name }}</q-item-label>
              <q-item-label caption>from {{ channel.adminNick }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-sm">
                <q-btn
                  flat
                  dense
                  no-caps
                  label="Decline"
                  @click="chat.declineInvite(channel.name)"
                />
                <q-btn
                  unelevated
                  dense
                  no-caps
                  color="primary"
                  label="Accept"
                  class="q-px-sm"
                  @click="accept(channel.name)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <q-card flat bordered>
        <q-card-section class="text-subtitle1 text-weight-bold">
          <q-icon name="terminal" class="q-mr-xs" />
          Commands
        </q-card-section>
        <q-markup-table flat dense wrap-cells>
          <tbody>
            <tr v-for="command in COMMANDS" :key="command.usage">
              <td
                ><code>{{ command.usage }}</code></td
              >
              <td class="text-grey-8">{{ command.description }}</td>
            </tr>
            <tr>
              <td><code>@nickName</code></td>
              <td class="text-grey-8">Mention someone in a message</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { COMMANDS } from "@/lib/commands";
import { useChatStore } from "@/stores/chat-store";

const chat = useChatStore();
const router = useRouter();

const invites = computed(() => chat.sortedChannels.filter(c => c.invited));

async function accept(name: string) {
  chat.acceptInvite(name);
  await router.push(`/channels/${name}`);
}
</script>

<style scoped>
.welcome-content {
  max-width: 720px;
  margin: 0 auto;
  padding-top: 24px;
}
</style>
