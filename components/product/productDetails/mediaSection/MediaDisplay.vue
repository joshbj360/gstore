<template>
  <div class="relative w-full h-full">
    <!-- Video Player - Full width on mobile -->
    <template v-if="productMedia?.type === MediaType.VIDEO">
      <video
        ref="videoRef"
        :src="productMedia.url"
        autoplay
        :muted="muteVideo"
        loop
        playsinline
        class="w-full h-full object-cover rounded-lg"
        @error="handleError"
        @click="togglePlay"
        aria-label="Product video"
      />
      <div class="absolute top-1 right-1 flex gap-1">
        <button
          @click.stop="togglePlay"
          class="bg-white/90 p-1 rounded-full shadow-sm hover:bg-[#f02c56] hover:text-white transition-all"
          :aria-label="isPlaying ? 'Pause video' : 'Play video'"
        >
          <Icon :name="isPlaying ? 'mdi:pause' : 'mdi:play'" size="14" />
        </button>
        <button
          @click.stop="toggleMute"
          class="bg-white/90 p-1 rounded-full shadow-sm hover:bg-[#f02c56] hover:text-white transition-all"
          :aria-label="muteVideo ? 'Unmute video' : 'Mute video'"
        >
          <Icon :name="muteVideo ? 'mdi:volume-off' : 'mdi:volume-high'" size="14" />
        </button>
      </div>
    </template>

    <!-- Image - Full width on mobile -->
    <template v-else-if="productMedia?.type === MediaType.IMAGE">
      <img
        :src="productMedia.url"
        :alt="`Product image ${productMedia.id || ''}`"
        class="w-full h-full object-cover rounded-lg"
        :loading="loading"
        @error="handleError"
      />
    </template>

    <!-- Placeholder - Full width on mobile -->
    <template v-else>
      <img
        src="https://picsum.photos/id/1000/800/800"
        alt="Placeholder image"
        class="w-full h-full object-cover rounded-lg"
      />
    </template>

    <!-- Error State -->
    <div
      v-if="error"
      class="absolute inset-0 flex items-center justify-center bg-gray-200/80 text-gray-600 text-xs sm:text-sm rounded-lg flex-col p-2"
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { PropType } from 'vue';
import { MediaType, type MediaInterface } from '~/models/interface/products/media.interface';

const props = defineProps({
  productMedia: {
    type: Object as PropType<MediaInterface>,
    default: null,
  },
  loading: {
    type: String as PropType<'eager' | 'lazy'>,
    default: 'eager',
  },
});

const emit = defineEmits<{
  (e: 'update:muteVideo', mute: boolean): void;
}>();

const muteVideo = ref(true);
const error = ref(false);
const isPlaying = ref(true);
const videoRef = ref<HTMLVideoElement | null>(null);

const toggleMute = () => {
  muteVideo.value = !muteVideo.value;
  emit('update:muteVideo', muteVideo.value);
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
/* Mobile-specific optimizations */
@media (max-width: 640px) {
  video, img {
    min-height: 100%;
    min-width: 100%;
  }

  .absolute.top-1.right-1 {
    top: 0.25rem;
    right: 0.25rem;
  }
}

/* Desktop hover effects */
@media (min-width: 768px) {
  button:hover {
    transform: scale(1.1);
  }
}
</style>