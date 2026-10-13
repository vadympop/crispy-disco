<template>
  <!-- Place inside the element that should open it (avatar, nick, list item) -->
  <q-menu anchor="bottom left" self="top left" :offset="[0, 6]">
    <q-card class="profile-card">
      <q-card-section class="row items-center no-wrap">
        <UserAvatar :nick-name="nickName" size="56px" class="q-mr-md">
          <q-badge
            floating
            rounded
            class="status-dot"
            :style="{ background: status.color }"
          />
        </UserAvatar>
        <div style="min-width: 0">
          <div class="text-subtitle1 text-weight-bold ellipsis">
            {{ fullName }}
          </div>
          <div class="muted ellipsis">@{{ nickName }}</div>
          <div class="row items-center no-wrap text-caption q-mt-xs">
            <q-icon
              name="circle"
              size="10px"
              class="q-mr-xs"
              :style="{ color: status.color }"
            />
            {{ status.label }}
          </div>
        </div>
      </q-card-section>

      <q-card-section class="stats q-py-sm">
        <div class="stat">
          <div class="stat-value">{{ stats.messageCount }}</div>
          <div class="stat-label">Messages</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ stats.sharedChannels.length }}</div>
          <div class="stat-label">Shared channels</div>
        </div>
      </q-card-section>

      <q-card-section v-if="stats.sharedChannels.length > 0" class="q-pt-sm">
        <div class="row q-gutter-xs">
          <q-chip
            v-for="name in stats.sharedChannels"
            :key="name"
            v-close-popup
            dense
            clickable
            icon="tag"
            class="channel-chip"
            :label="name"
            @click="openChannel(name)"
          />
        </div>
      </q-card-section>

      <q-card-actions class="q-px-md q-pb-md">
        <div v-if="isMe" class="muted text-caption full-width text-center">
          This is you
        </div>
        <q-btn
          v-else
          v-close-popup
          rounded
          outline
          no-caps
          color="white"
          icon="chat"
          label="Start a chat"
          class="full-width"
          @click="startChat"
        />
      </q-card-actions>
    </q-card>
  </q-menu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { statusOption } from "@/lib/status";
import { useChatStore } from "@/stores/chat-store";
import UserAvatar from "@/components/chat/UserAvatar.vue";

const props = defineProps<{ nickName: string }>();
// fired before leaving to another channel, so a parent dialog can close
const emit = defineEmits<{ navigated: [] }>();

const chat = useChatStore();
const router = useRouter();

const isMe = computed(() => props.nickName === chat.me.nickName);
const user = computed(() =>
  isMe.value ? chat.me : chat.findUser(props.nickName)
);

const fullName = computed(() =>
  user.value ? `${user.value.firstName} ${user.value.lastName}` : props.nickName
);
const status = computed(() => statusOption(user.value?.status ?? "offline"));
const stats = computed(() => chat.userStats(props.nickName));

async function openChannel(name: string) {
  emit("navigated");
  await router.push(`/channels/${name}`);
}

async function startChat() {
  await openChannel(chat.startDirectChat(props.nickName));
}
</script>

<style scoped>
.profile-card {
  width: 280px;
  max-width: calc(100vw - 32px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.muted {
  opacity: 0.7;
}

.status-dot {
  width: 14px;
  height: 14px;
  min-height: 0;
  padding: 0;
  border: 2px solid #252a5c;
  top: auto;
  bottom: 0;
  right: 0;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.7;
}

.channel-chip {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}
</style>
