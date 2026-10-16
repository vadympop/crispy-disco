<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="auth-page flex flex-center">
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.auth-page {
  background: #505ba3;
  padding: var(--space-md);
}

/* tablets and desktops: a bit more breathing room inside the card */
@media (min-width: 600px) {
  .auth-page {
    padding: var(--space-lg);
  }

  .auth-page :deep(.auth-card) {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
  }
}

/* phones: the card becomes the whole screen */
@media (max-width: 599px) {
  .auth-page {
    padding: 0;
    align-items: stretch;
  }

  .auth-page :deep(.auth-card) {
    max-width: none;
    min-height: 100dvh;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .auth-page :deep(.auth-btn) {
    width: 100%;
  }

  .auth-page :deep(.q-field__native) {
    font-size: 16px;
  }
}
</style>
