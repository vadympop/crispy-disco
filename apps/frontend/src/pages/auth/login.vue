<template>
  <q-card class="auth-card">
    <q-card-section class="text-center">
      <div class="text-h5 text-primary">Sign in</div>
      <div class="text-caption text-grey-7">Welcome back to crispy-disco</div>
    </q-card-section>

    <q-form class="q-gutter-md q-px-md q-pb-md" greedy>
      <q-input
        v-model="form.email"
        label="Email"
        type="email"
        outlined
        autocomplete="email"
        :rules="[required, isEmail]"
      >
      </q-input>

      <q-input
        v-model="form.password"
        label="Password"
        type="password"
        outlined
        autocomplete="current-password"
        :rules="[required]"
      />

      <div class="flex flex-center">
        <q-btn
          type="submit"
          color="primary"
          label="Sign in"
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
      Don't have an account?
      <router-link to="/auth/register" class="text-primary">Register</router-link>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const form = reactive({
  email: "",
  password: ""
});
const loading = ref(false);

const required = (val: string) => !!val || "This field is required";
const isEmail = (val: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || "Enter a valid email";

// TODO: replace with a real API call once the backend is ready
// async function onSubmit() {
//   loading.value = true;
//   await new Promise(resolve => setTimeout(resolve, 500));
//   loading.value = false;
//   await router.push("/");
// }
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-btn {
  min-width: 220px;
}
</style>
