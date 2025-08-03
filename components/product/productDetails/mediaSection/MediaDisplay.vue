<template>
  <div class="relative w-full h-full bg-black">
    <div
      class="absolute inset-0 w-full h-full bg-cover bg-center filter blur-lg scale-110"
      :style="{ backgroundImage: `url(${productMedia?.url || ''})` }"
      v-if="productMedia?.type === 'IMAGE'"
    ></div>
    <div
      class="absolute inset-0 w-full h-full bg-black"
      v-if="productMedia?.type === 'VIDEO'"
    ></div>

    <div class="relative w-full h-full flex items-center justify-center">
      <template v-if="productMedia?.type === 'VIDEO'">
        <video
          ref="videoRef"
          :src="productMedia.url"
          autoplay
          :muted="muteVideo"
          loop
          playsinline
          class="w-full h-full object-contain z-10"
          @error="handleError"
          @click="togglePlay"
          aria-label="Product video"
        />
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
            :aria-label="muteVideo ? 'Unmute video' : 'Mute video'"
          >
            <Icon
              :name="muteVideo ? 'mdi:volume-off' : 'mdi:volume-high'"
              size="16"
            />
          </button>
        </div>
      </template>

      <template v-else-if="productMedia?.type === 'IMAGE'">
        <img
          :src="productMedia.url"
          :alt="`Product image ${productMedia.id || ''}`"
          class="w-full h-full object-contain z-10"
          :loading="loading"
          @error="handleError"
        />
      </template>

      <template v-else>
        <img
          src="https://picsum.photos/id/1000/800/800"
          alt="Placeholder image"
          class="w-full h-full object-contain z-10"
        />
      </template>

      <div
        v-if="error"
        class="absolute inset-0 flex items-center justify-center bg-gray-200/80 text-gray-600 text-xs sm:text-sm rounded-lg flex-col p-2 z-20"
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
import { ref } from "vue";
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
});

const emit = defineEmits<{
  (e: "update:muteVideo", mute: boolean): void;
}>();

const muteVideo = ref(true);
const error = ref(false);
const isPlaying = ref(true);
const videoRef = ref<HTMLVideoElement | null>(null);

const toggleMute = () => {
  muteVideo.value = !muteVideo.value;
  emit("update:muteVideo", muteVideo.value);
};

const togglePlay = () => {
  if (videoRef.value) {
    if (isPlaying.value) {
      videoRef.value.pause();
    } else {
      videoRef.value.play().catch(() => {
        error.value = true;
      });
    }
    isPlaying.value = !isPlaying.value;
  }
};

const handleError = () => {
  error.value = true;
};

const retryLoad = () => {
  error.value = false;
  if (videoRef.value && props.productMedia?.type === MediaType.VIDEO) {
    videoRef.value.load();
    videoRef.value.play().catch(() => {
      error.value = true;
    });
    isPlaying.value = true;
  }
};
</script>

<style scoped>
/* Ensure the container takes up the full space */
.relative.w-full.h-full {
  overflow: hidden;
}
</style>