<template>
  <q-card class="auth-card">
    <q-card-section class="text-center">
      <div class="text-h5 text-primary">Create account</div>
      <div class="text-caption text-grey-7">Join crispy-disco</div>
    </q-card-section>

    <q-form class="q-gutter-md q-px-md q-pb-md" greedy @submit="onSubmit">
      <div class="name-row">
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

      <q-input
        v-model="form.nickName"
        label="Nickname"
        outlined
        autocomplete="username"
        hint="Unique, used for @mentions and /invite"
        :rules="[required, isNickName]"
      />

      <q-input
        v-model="form.email"
        label="Email"
        type="email"
        outlined
        autocomplete="email"
        :rules="[required, isEmail]"
      />

      <q-input
        v-model="form.password"
        label="Password"
        type="password"
        outlined
        autocomplete="new-password"
        :rules="[required, minLength(8)]"
      />

      <q-input
        v-model="form.passwordConfirm"
        label="Confirm password"
        type="password"
        outlined
        autocomplete="new-password"
        :rules="[required, matchesPassword]"
      />

      <div class="flex flex-center">
        <q-btn
          type="submit"
          color="primary"
          label="Create account"
          class="auth-btn"
          :loading="loading"
          rounded
          unelevated
          no-caps
        />
      </div>
    </q-form>

    <q-separator />

    <q-card-section class="text-center text-body2">
      Already have an account?
      <router-link to="/auth/login" class="text-primary">Sign in</router-link>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const form = reactive({
  firstName: "",
  lastName: "",
  nickName: "",
  email: "",
  password: "",
  passwordConfirm: ""
});
const loading = ref(false);

const required = (val: string) => !!val || "This field is required";
const isEmail = (val: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || "Enter a valid email";
const isNickName = (val: string) =>
  /^[a-zA-Z0-9_.-]{3,30}$/.test(val) ||
  "3-30 characters: letters, numbers, _ . -";
const minLength = (n: number) => (val: string) =>
  val.length >= n || `At least ${n} characters`;
const matchesPassword = (val: string) =>
  val === form.password || "Passwords do not match";

// TODO: replace with a real API call once the backend is ready
async function onSubmit() {
  loading.value = true;
  await new Promise(resolve => setTimeout(resolve, 500));
  loading.value = false;
  await router.push("/channels");
}
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 480px;
}

.name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

@media (max-width: 599px) {
  .name-row {
    grid-template-columns: 1fr;
  }
}

.auth-btn {
  min-width: 220px;
}
</style>
