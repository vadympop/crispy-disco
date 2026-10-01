<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="landing-header">
      <q-toolbar class="landing-container">
        <DiscoBallLogo :size="30" class="q-mr-sm" />
        <q-toolbar-title class="text-weight-bold">crispy-disco</q-toolbar-title>

        <q-btn
          rounded
          outline
          no-caps
          color="white"
          label="Log in"
          to="/auth/login"
          class="gt-xs q-mr-sm"
        />
        <q-btn
          rounded
          outline
          no-caps
          color="white"
          label="Register"
          to="/auth/register"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <section class="hero text-white">
          <!-- hand-drawn arrow nudging visitors towards the header buttons -->
          <div class="landing-container hero-pointer gt-xs">
            <span class="hero-pointer-label">Join the party</span>
            <svg
              class="hero-pointer-arrow"
              width="72"
              height="64"
              viewBox="0 0 72 64"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 60 C 30 58, 58 44, 60 8"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              />
              <path
                d="M50 18 L 60 6 L 68 20"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div class="landing-container text-center">
            <h3 class="hero-title">A place for your gang to talk with huzz</h3>
            <p class="hero-subtitle">
              Introducing the world's first messenger where you can see what
              your friends think, not what they send you. It comes with a purple
              theme that makes you feel like you're in a club, making your
              communication easy and honest.
            </p>
          </div>

          <div class="landing-container">
            <div class="text-h5 text-center q-mb-lg">What you can do</div>

            <div class="features">
              <q-card
                v-for="feature in features"
                :key="feature.title"
                flat
                class="feature-card"
              >
                <q-card-section>
                  <q-icon :name="feature.icon" size="32px" />
                  <div class="text-subtitle1 text-weight-bold q-mt-sm">
                    {{ feature.title }}
                  </div>
                  <div class="feature-description text-body2">
                    {{ feature.description }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </section>

        <footer class="landing-footer text-center text-white q-pa-lg">
          crispy-disco · provided by RuPo
        </footer>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import DiscoBallLogo from "@/components/DiscoBallLogo.vue";

// macOS rubber-band overscroll reveals the root background, which is white
// by default. Match it to the header/footer while this page is open.
const LANDING_BG = "#252a5c";

onMounted(() => {
  document.documentElement.style.backgroundColor = LANDING_BG;
});

onBeforeUnmount(() => {
  document.documentElement.style.backgroundColor = "";
});

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
  background: #252a5c;
}

.landing-container {
  max-width: 1100px;
  margin: 0 auto;
  padding-left: 16px;
  padding-right: 16px;
}

.hero {
  background: linear-gradient(180deg, #505ba3 0%, #3b4488 100%);
  padding: 104px 0 80px;
}

.hero-pointer {
  position: relative;
  height: 0;
}

.hero-pointer-label,
.hero-pointer-arrow {
  position: absolute;
  color: #ffffff;
  opacity: 0.85;
}

/* the arrow tip sits right under the Log in / Register buttons */
.hero-pointer-arrow {
  top: -98px;
  right: 72px;
}

.hero-pointer-label {
  top: -48px;
  right: 150px;
  font-style: italic;
  font-size: 1rem;
  white-space: nowrap;
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
  background: #252a5c;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feature-description {
  opacity: 0.8;
}

.landing-footer {
  background: #252a5c;
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
