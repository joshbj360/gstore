<template>
  <div class="relative w-full h-screen flex items-center justify-center z-10">
    <!-- Background image (blurred) -->
    <div
      v-if="productMedia?.type === 'IMAGE'"
      class="blurry-background z-0"
      :style="{ backgroundImage: `url(${productMedia?.url || ''})` }"
    ></div>

    <!-- Video black background -->
    <div
      v-if="productMedia?.type === 'VIDEO'"
      class="absolute inset-0 w-full h-full bg-black z-0"
    ></div>

    <!-- Media content -->
    <div class="relative w-full h-full flex items-center justify-center z-10">
      <template v-if="productMedia?.type === 'VIDEO'">
        <video
          ref="videoRef"
          :src="productMedia.url"
          muted
          loop
          playsinline
          class="media-content"
          @error="handleError"
          aria-label="Product video"
        />

        <!-- Controls -->
        <div class="absolute top-4 right-4 flex gap-2 z-20">
          <button
            @click.stop="togglePlay"
            class="bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-[#f02c56] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50"
            :aria-label="isPlaying ? 'Pause video' : 'Play video'"
          >
            <Icon :name="isPlaying ? 'mdi:pause' : 'mdi:play'" size="16" />
          </button>
          <button
            @click.stop="toggleMute"
            class="bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-[#f02c56] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50"
            :aria-label="isMuted ? 'Unmute video' : 'Mute video'"
          >
            <Icon :name="isMuted ? 'mdi:volume-off' : 'mdi:volume-high'" size="16" />
          </button>
        </div>
      </template>

      <template v-else-if="productMedia?.type === 'IMAGE'">
        <img
          :src="productMedia.url"
          :alt="`Product image ${productMedia.id || ''}`"
          class="media-content"
          :loading="loading"
          @error="handleError"
        />
      </template>

      <template v-else>
        <img
          src="https://picsum.photos/id/1000/800/800"
          alt="Placeholder image"
          class="media-content"
        />
      </template>

      <!-- Error fallback -->
      <div
        v-if="error"
        class="absolute inset-0 flex items-center justify-center bg-gray-200/80 text-gray-600 text-xs sm:text-sm rounded-lg flex-col p-2 z-30"
      >
        <span class="text-center">Media unavailable</span>
        <button
          @click="retryLoad"
          class="mt-1 text-[#f02c56] hover:underline focus:outline-none"
          aria-label="Retry loading media"
        >
          Retry
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import type { PropType } from "vue";
import {
  MediaType,
  type MediaInterface,
} from "~/models/interface/products/media.interface";

const props = defineProps({
  productMedia: {
    type: Object as PropType<MediaInterface>,
    default: null,
  },
  loading: {
    type: String as PropType<"eager" | "lazy">,
    default: "eager",
  },
  isPlaying: {
    type: Boolean,
    default: true,
  },
});

const isMuted = ref(true);
const error = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);

watch(() => props.isPlaying, (shouldPlay) => {
    if (videoRef.value) {
        if (shouldPlay) {
            videoRef.value.play().catch(e => console.error("Video play failed:", e));
        } else {
            videoRef.value.pause();
            videoRef.value.currentTime = 0;
        }
    }
});

const togglePlay = () => {
  if (videoRef.value) {
    if (!videoRef.value.paused) {
      videoRef.value.pause();
    } else {
      videoRef.value.play().catch(e => console.error("Video play failed:", e));
    }
  }
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;
  if (videoRef.value) {
    videoRef.value.muted = isMuted.value;
  }
};

const handleError = () => {
  error.value = true;
};

const retryLoad = () => {
  error.value = false;
  if (videoRef.value && props.productMedia?.type === MediaType.VIDEO) {
    videoRef.value.load();
    if(props.isPlaying) {
        videoRef.value.play().catch(e => console.error("Video play failed:", e));
    }
  }
};
</script>

<style>
.blurry-background {
  @apply absolute inset-0 w-full h-full;
  background-size: cover;
  background-position: center;
  filter: blur(1.5rem);
  transform: scale(1.1);
}

.media-content {
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 10;
}
</style>
