<template>
  <q-dialog v-model="open" @hide="reset">
    <q-card class="create-card">
      <q-card-section>
        <div class="text-h6">Create or join a channel</div>
        <div class="text-caption text-grey-7">
          Same as typing /join name [private] in the command line
        </div>
      </q-card-section>

      <q-form @submit="onSubmit">
        <q-card-section class="q-pt-none">
          <q-input
            v-model="name"
            label="Channel name"
            outlined
            autofocus
            prefix="#"
            :rules="[isChannelName]"
          />
          <q-toggle v-model="isPrivate" label="Private channel" />
          <div class="text-caption text-grey-7">
            {{
              isPrivate
                ? "Only people you invite can join."
                : "Anyone can join with /join."
            }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat no-caps label="Cancel" />
          <q-btn
            type="submit"
            unelevated
            no-caps
            color="primary"
            label="Create"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useChatStore } from "@/stores/chat-store";

const open = defineModel<boolean>({ required: true });

const chat = useChatStore();
const router = useRouter();

const name = ref("");
const isPrivate = ref(false);

const isChannelName = (val: string) =>
  /^[a-zA-Z0-9_-]{2,30}$/.test(val) || "2-30 characters: letters, numbers, _ -";

async function onSubmit() {
  if (chat.joinChannel(name.value, isPrivate.value)) {
    open.value = false;
    await router.push(`/channels/${name.value}`);
  }
}

function reset() {
  name.value = "";
  isPrivate.value = false;
}
</script>

<style scoped>
.create-card {
  width: 100%;
  max-width: 420px;
}
</style>
