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
  padding: 16px;
}

/* tablets and desktops: a bit more breathing room inside the card */
@media (min-width: 600px) {
  .auth-page {
    padding: 32px;
  }

  .auth-page :deep(.auth-card) {
    padding: 8px 16px;
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

  /* full-width button is easier to tap */
  .auth-page :deep(.auth-btn) {
    width: 100%;
  }

  /* 16px inputs stop iOS Safari from zooming in on focus */
  .auth-page :deep(.q-field__native) {
    font-size: 16px;
  }
}
</style>
