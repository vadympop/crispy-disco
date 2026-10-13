<template>
  <q-page padding class="welcome-page">
    <div class="welcome-content">
      <div class="welcome-title text-weight-bold q-mb-xs">
        Welcome, {{ chat.me.firstName }}! 👋
      </div>
      <div class="welcome-subtitle text-body1 q-mb-lg">
        Pick a channel on the left, or type
        <code>/join channelName</code> in the command line below.
      </div>

      <q-card v-if="invites.length > 0" flat class="welcome-card q-mb-md">
        <q-card-section class="text-subtitle1 text-weight-bold">
          <q-icon name="mail" class="q-mr-xs" style="color: #ffe27a" />
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
                  rounded
                  outline
                  dense
                  no-caps
                  color="white"
                  label="Accept"
                  class="q-px-md"
                  @click="accept(channel.name)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <q-card flat class="welcome-card">
        <q-card-section class="text-subtitle1 text-weight-bold">
          <q-icon name="terminal" class="q-mr-xs" />
          Commands
        </q-card-section>
        <q-markup-table flat dense wrap-cells class="commands-table">
          <tbody>
            <tr v-for="command in COMMANDS" :key="command.usage">
              <td
                ><code>{{ command.usage }}</code></td
              >
              <td class="muted">{{ command.description }}</td>
            </tr>
            <tr>
              <td><code>@nickName</code></td>
              <td class="muted">Mention someone in a message</td>
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
  color: #ffffff;
}

.welcome-title {
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  line-height: 1.15;
}

.welcome-subtitle,
.muted {
  opacity: 0.85;
}

/* same look as the feature cards on the landing */
.welcome-card {
  border-radius: 12px;
  background: #252a5c;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.commands-table {
  background: transparent;
}

code {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 1px 5px;
}
</style>
