<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="crispy-disco logo"
  >
    <defs>
      <radialGradient :id="`${uid}-ball`" cx="0.38" cy="0.4" r="0.7">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="55%" stop-color="#d4d8f0" />
        <stop offset="100%" stop-color="#8e96cc" />
      </radialGradient>
      <clipPath :id="`${uid}-clip`">
        <circle cx="16" cy="18" r="11" />
      </clipPath>
    </defs>

    <!-- hanging string -->
    <line x1="16" y1="0" x2="16" y2="7" stroke="currentColor" stroke-width="1.2" />

    <circle cx="16" cy="18" r="11" :fill="`url(#${uid}-ball)`" />

    <!-- mirror facets -->
    <g
      :clip-path="`url(#${uid}-clip)`"
      stroke="#505ba3"
      stroke-opacity="0.45"
      stroke-width="0.8"
    >
      <ellipse cx="16" cy="18" rx="3.6" ry="11" />
      <ellipse cx="16" cy="18" rx="7.6" ry="11" />
      <line x1="16" y1="7" x2="16" y2="29" />
      <line x1="5" y1="18" x2="27" y2="18" />
      <path d="M5.6 13.5 Q16 11.8 26.4 13.5" />
      <path d="M5.6 22.5 Q16 24.2 26.4 22.5" />
      <path d="M8 9.8 Q16 8.4 24 9.8" />
      <path d="M8 26.2 Q16 27.6 24 26.2" />
    </g>

    <!-- lit facets -->
    <rect x="9.2" y="13.9" width="3" height="3" fill="#ffffff" opacity="0.9" />
    <rect x="12.7" y="10.6" width="2.8" height="2.6" fill="#ffffff" opacity="0.7" />

    <circle cx="16" cy="18" r="11" stroke="currentColor" stroke-width="1" />

    <!-- sparkle -->
    <path
      d="M27 3 L27.9 5.6 L30.5 6.5 L27.9 7.4 L27 10 L26.1 7.4 L23.5 6.5 L26.1 5.6 Z"
      fill="#ffe27a"
    />
  </svg>
</template>

<script setup lang="ts">
import { useId } from "vue";

withDefaults(defineProps<{ size?: number | string }>(), { size: 32 });

const uid = useId();
</script>
