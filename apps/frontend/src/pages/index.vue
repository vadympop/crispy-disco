<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="landing-header">
      <q-toolbar class="landing-container">
        <q-icon name="forum" size="28px" class="q-mr-sm" />
        <q-toolbar-title class="text-weight-bold">crispy-disco</q-toolbar-title>

        <q-btn
          flat
          no-caps
          label="Log in"
          to="/auth/login"
          class="gt-xs q-mr-sm"
        />
        <q-btn
          rounded
          unelevated
          no-caps
          color="white"
          text-color="dark"
          label="Open app"
          to="/auth/register"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <section class="hero text-white">
          <div class="landing-container text-center">
            <h1 class="hero-title">A place for your team to talk</h1>
            <p class="hero-subtitle">
              IRC-style channels, slash commands and @mentions. Public or
              private, on your phone or on your desktop.
            </p>

            <div class="hero-actions">
              <q-btn
                rounded
                unelevated
                no-caps
                size="lg"
                color="white"
                text-color="dark"
                icon="person_add"
                label="Create an account"
                to="/auth/register"
              />
              <q-btn
                rounded
                outline
                no-caps
                size="lg"
                color="white"
                icon="login"
                label="I already have one"
                to="/auth/login"
              />
            </div>
          </div>
        </section>

        <section class="landing-container q-py-xl">
          <div class="text-h5 text-center q-mb-lg">What you can do</div>

          <div class="features">
            <q-card
              v-for="feature in features"
              :key="feature.title"
              flat
              bordered
              class="feature-card"
            >
              <q-card-section>
                <q-icon :name="feature.icon" size="32px" color="primary" />
                <div class="text-subtitle1 text-weight-bold q-mt-sm">
                  {{ feature.title }}
                </div>
                <div class="text-body2 text-grey-8">
                  {{ feature.description }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </section>

        <footer class="landing-footer text-center text-grey-7 q-pa-lg">
          crispy-disco · semester project
        </footer>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "tag",
    title: "Channels",
    description:
      "Create public or private channels. The creator is the admin and can close the channel any time."
  },
  {
    icon: "terminal",
    title: "Command line",
    description:
      "/join, /invite, /kick, /list and more: everything from one input box."
  },
  {
    icon: "alternate_email",
    title: "Mentions",
    description: "Address someone with @nickname and it stands out for them."
  },
  {
    icon: "notifications",
    title: "Notifications",
    description:
      "Get notified about new messages, or only about mentions, while the app is in the background."
  },
  {
    icon: "circle",
    title: "Statuses",
    description: "Online, do not disturb or offline. Everyone sees yours."
  },
  {
    icon: "keyboard",
    title: "Live typing",
    description:
      "See who is typing and peek at their draft as it is being written."
  }
];
</script>

<style scoped>
.landing-header {
  background: #505ba3;
}

.landing-container {
  max-width: 1100px;
  margin: 0 auto;
  padding-left: 16px;
  padding-right: 16px;
}

.hero {
  background: linear-gradient(180deg, #505ba3 0%, #3b4488 100%);
  padding: 64px 0 80px;
}

.hero-title {
  font-size: clamp(2rem, 6vw, 3.5rem);
  line-height: 1.15;
  font-weight: 700;
  margin: 0 0 16px;
}

.hero-subtitle {
  font-size: 1.15rem;
  max-width: 640px;
  margin: 0 auto 32px;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.feature-card {
  border-radius: 12px;
}

.landing-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* phones: stack the hero buttons full width */
@media (max-width: 599px) {
  .hero {
    padding: 40px 0 56px;
  }

  .hero-actions .q-btn {
    width: 100%;
  }
}
</style>
