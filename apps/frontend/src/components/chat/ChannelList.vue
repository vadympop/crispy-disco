<template>
  <q-list class="channel-list">
    <q-item-label header class="row items-center no-wrap">
      <span class="col">Channels</span>
      <q-btn
        flat
        dense
        round
        size="sm"
        icon="add"
        aria-label="Create channel"
        @click="createOpen = true"
      >
        <q-tooltip>Create or join a channel</q-tooltip>
      </q-btn>
    </q-item-label>

    <!-- Invites: highlighted and always on top (sortedChannels puts them first) -->
    <q-item
      v-for="channel in invites"
      :key="channel.name"
      class="invite-item q-mx-sm q-mb-xs"
    >
      <q-item-section avatar>
        <q-icon name="mail" color="warning" />
      </q-item-section>
      <q-item-section>
        <q-item-label class="text-weight-bold"
          >#{{ channel.name }}</q-item-label
        >
        <q-item-label caption
          >Invitation from {{ channel.adminNick }}</q-item-label
        >
      </q-item-section>
      <q-item-section side class="row no-wrap">
        <div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="check"
            color="positive"
            aria-label="Accept"
            @click="accept(channel.name)"
          />
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="close"
            color="negative"
            aria-label="Decline"
            @click="chat.declineInvite(channel.name)"
          />
        </div>
      </q-item-section>
    </q-item>

    <q-item
      v-for="channel in joined"
      :key="channel.name"
      :to="`/channels/${channel.name}`"
      clickable
      active-class="channel-active"
      class="q-mx-sm channel-item"
    >
      <q-item-section avatar class="channel-icon">
        <q-icon :name="channel.isPrivate ? 'lock' : 'tag'" size="20px" />
      </q-item-section>
      <q-item-section>
        <q-item-label lines="1">{{ channel.name }}</q-item-label>
      </q-item-section>
      <q-item-section side class="row no-wrap items-center">
        <div class="row no-wrap items-center">
          <q-icon
            v-if="chat.isAdmin(channel)"
            name="star"
            size="16px"
            color="amber"
          >
            <q-tooltip>You are the admin</q-tooltip>
          </q-icon>
          <!-- .stop.prevent so the click doesn't also open the channel -->
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="more_vert"
            aria-label="Channel actions"
            @click.stop.prevent
          >
            <q-menu>
              <q-list dense style="min-width: 160px">
                <q-item v-close-popup clickable @click="leave(channel.name)">
                  <q-item-section avatar
                    ><q-icon name="logout"
                  /></q-item-section>
                  <q-item-section>Leave channel</q-item-section>
                </q-item>
                <q-item
                  v-if="chat.isAdmin(channel)"
                  v-close-popup
                  clickable
                  class="text-negative"
                  @click="remove(channel.name)"
                >
                  <q-item-section avatar
                    ><q-icon name="delete"
                  /></q-item-section>
                  <q-item-section>Delete channel</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-item-section>
    </q-item>

    <q-item v-if="joined.length === 0 && invites.length === 0">
      <q-item-section class="text-grey-7 text-caption">
        No channels yet. Create one or type /join name
      </q-item-section>
    </q-item>

    <CreateChannelDialog v-model="createOpen" />
  </q-list>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useChatStore } from "@/stores/chat-store";
import CreateChannelDialog from "@/components/chat/CreateChannelDialog.vue";

const chat = useChatStore();
const route = useRoute();
const router = useRouter();

const createOpen = ref(false);

const invites = computed(() => chat.sortedChannels.filter(c => c.invited));
const joined = computed(() => chat.sortedChannels.filter(c => !c.invited));

async function accept(name: string) {
  chat.acceptInvite(name);
  await router.push(`/channels/${name}`);
}

// After leaving/deleting the open channel, go back to the welcome screen
async function leave(name: string) {
  chat.leaveChannel(name);
  await goHomeIfOpen(name);
}

async function remove(name: string) {
  chat.deleteChannel(name);
  await goHomeIfOpen(name);
}

async function goHomeIfOpen(name: string) {
  if (!chat.findChannel(name) && route.path === `/channels/${name}`) {
    await router.push("/channels");
  }
}
</script>

<style scoped>
.channel-item {
  border-radius: 8px;
  min-height: 40px;
}

.channel-icon {
  min-width: 32px;
}

.channel-active {
  background: rgba(80, 91, 163, 0.12);
  color: #505ba3;
  font-weight: 600;
}

.invite-item {
  border-radius: 8px;
  background: rgba(242, 192, 55, 0.18);
  border-left: 3px solid #f2c037;
}
</style>
