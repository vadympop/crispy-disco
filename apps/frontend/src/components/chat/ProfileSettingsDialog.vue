<template>
  <q-dialog v-model="open" @before-show="reset">
    <q-card flat class="dialog-card settings-card">
      <q-card-section class="row items-center no-wrap">
        <div class="text-h6 col">Settings</div>
        <q-btn v-close-popup flat round dense icon="close" aria-label="Close" />
      </q-card-section>

      <q-form @submit="onSubmit">
        <q-card-section class="settings-body q-pt-none">
          <div class="section-title">Profile</div>

          <div class="row items-center no-wrap q-mb-md">
            <UserAvatar
              :nick-name="form.nickName || chat.me.nickName"
              :src="form.avatarUrl"
              size="72px"
              class="q-mr-md"
            />
            <div class="column q-gutter-xs">
              <q-btn
                rounded
                outline
                dense
                no-caps
                color="white"
                icon="photo_camera"
                label="Change picture"
                class="q-px-md"
                @click="fileInput?.click()"
              />
              <q-btn
                v-if="form.avatarUrl"
                flat
                dense
                no-caps
                label="Remove picture"
                class="muted"
                @click="form.avatarUrl = ''"
              />
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              hidden
              @change="onFileChange"
            />
          </div>

          <q-input
            v-model="form.nickName"
            label="Nickname"
            outlined
            prefix="@"
            autocomplete="username"
            hint="Unique, used for @mentions and /invite"
            :rules="[required, isNickName]"
          />

          <div class="name-row q-mt-sm">
            <q-input
              v-model="form.firstName"
              label="First name"
              outlined
              autocomplete="given-name"
              :rules="[required]"
            />
            <q-input
              v-model="form.lastName"
              label="Last name"
              outlined
              autocomplete="family-name"
              :rules="[required]"
            />
          </div>

          <div class="section-title q-mt-sm">Status</div>
          <q-list class="option-list">
            <q-item
              v-for="option in STATUS_OPTIONS"
              :key="option.value"
              clickable
              :active="form.status === option.value"
              active-class="option-active"
              @click="form.status = option.value"
            >
              <q-item-section avatar>
                <q-icon
                  name="circle"
                  size="14px"
                  :style="{ color: option.color }"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ option.label }}</q-item-label>
                <q-item-label caption>{{ option.hint }}</q-item-label>
              </q-item-section>
              <q-item-section v-if="form.status === option.value" side>
                <q-icon name="check" />
              </q-item-section>
            </q-item>
          </q-list>

          <div class="section-title q-mt-md">Notifications</div>
          <q-list class="option-list">
            <q-item tag="label">
              <q-item-section>
                <q-item-label>Notify only for mentions</q-item-label>
                <q-item-label caption
                  >Ignore messages without @{{
                    form.nickName || chat.me.nickName
                  }}</q-item-label
                >
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="form.notifyMentionsOnly" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions class="settings-actions q-px-md q-pb-md">
          <q-btn
            v-close-popup
            flat
            no-caps
            icon="logout"
            label="Log out"
            class="text-red-4"
            to="/"
          />
          <q-space />
          <q-btn v-close-popup flat no-caps label="Cancel" />
          <q-btn
            type="submit"
            rounded
            outline
            no-caps
            color="white"
            label="Save"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, useTemplateRef } from "vue";
import { Notify } from "quasar";
import type { UserStatus } from "@/types/chat";
import { STATUS_OPTIONS } from "@/lib/status";
import { useChatStore } from "@/stores/chat-store";
import UserAvatar from "@/components/chat/UserAvatar.vue";

const open = defineModel<boolean>({ required: true });

const chat = useChatStore();
const fileInput = useTemplateRef<HTMLInputElement>("fileInput");

// Pictures are scaled down before they are kept, so the store stays small
const AVATAR_SIZE = 160;

// Nothing is applied until Save; Cancel or closing throws the draft away
// avatarUrl "" means "no picture"
const form = reactive({
  nickName: "",
  firstName: "",
  lastName: "",
  avatarUrl: "",
  status: "online" as UserStatus,
  notifyMentionsOnly: false
});

function reset() {
  form.nickName = chat.me.nickName;
  form.firstName = chat.me.firstName;
  form.lastName = chat.me.lastName;
  form.avatarUrl = chat.me.avatarUrl ?? "";
  form.status = chat.me.status;
  form.notifyMentionsOnly = chat.notifyMentionsOnly;
}

// same rules as on the register page
const required = (val: string) => !!val || "This field is required";
const isNickName = (val: string) =>
  /^[a-zA-Z0-9_.-]{3,30}$/.test(val) ||
  "3-30 characters: letters, numbers, _ . -";

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  // Reset the input to allow the same file to be picked again
  input.value = "";
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    Notify.create({ type: "negative", message: "Pick an image file" });
    return;
  }

  try {
    form.avatarUrl = await toSquareAvatar(file);
  } catch {
    Notify.create({ type: "negative", message: "Could not read that image" });
  }
}

// Center-crops the picture to a square and scales it to AVATAR_SIZE
async function toSquareAvatar(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  canvas
    .getContext("2d")!
    .drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE
    );
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}

function onSubmit() {
  const saved = chat.updateProfile({
    nickName: form.nickName,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    avatarUrl: form.avatarUrl
  });
  if (!saved) {
    return;
  }
  chat.setStatus(form.status);
  chat.notifyMentionsOnly = form.notifyMentionsOnly;
  open.value = false;
}
</script>

<style scoped>
/* a bit wider than the other dialogs: first + last name sit side by side */
.settings-card {
  max-width: 460px;
}

.settings-body {
  max-height: 65vh;
  overflow-y: auto;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: var(--space-sm);
}

.name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.option-list {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.option-active {
  background: #505ba3;
  color: #ffffff;
}

.settings-actions {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: var(--space-md);
}

.muted {
  opacity: 0.7;
}

@media (max-width: 599px) {
  .name-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .settings-card :deep(.q-field__native) {
    font-size: 16px;
  }
}
</style>
