<template>
  <div class="relative w-full h-full bg-black">
    <div 
      class="blurry-background" 
      :style="{ backgroundImage: `url(${productMedia?.url || ''})` }" 
      v-if="productMedia?.type === EMediaType.IMAGE">
    </div>
    <div 
      class="absolute inset-0 w-full h-full bg-black" 
      v-if="productMedia?.type === EMediaType.VIDEO">
    </div>

    <div 
      class="relative w-full h-full flex items-center justify-center"
      tabindex="0"
    >
      <template v-if="productMedia?.type === EMediaType.VIDEO">
        <video
          ref="videoRef"
          :src="productMedia.url"
          muted
          loop
          playsinline
          class="media-content w-full h-full object-cover"
          @error="handleError"
          :aria-label="`Product video ${productMedia.altText || ''}`"
        />
        <div class="absolute top-4 right-4 flex gap-2 z-20">
          </div>
      </template>

      <template v-else-if="productMedia?.type === EMediaType.IMAGE">
        <CldImage 
          :src="productMedia.url" 
          :alt="`Product image ${productMedia.altText || ''}`" 
          class="media-content w-full h-full object-cover" 
          :loading="loading" 
          @error="handleError" 
          :width="width"
          :height="height"
        />
      </template>

      <template v-else>
         <img src="https://picsum.photos/id/1000/800/800" alt="Placeholder image" class="media-content" />
      </template>

      <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-gray-200/80 z-20">
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"; // Removed 'computed'
import type { PropType } from "vue";
import { EMediaType, type IMedia } from "~/models/interface/";

const props = defineProps({
  productMedia: {
    type: Object as PropType<IMedia>,
    default: null,
  },
  loading: {
    type: String as PropType<"eager" | "lazy">,
    default: "eager",
  },
  isPlaying: {
    type: Boolean,
    default: false,
  },
  width: {
    type: [String, Number] as PropType<string | number>,
    default: "500",
  },
  height: {
    type: [String, Number] as PropType<string | number>,
    default: "500",
  }
});

const error = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);


// MODIFIED: The watcher now *only* listens to the isPlaying prop.
watch(() => props.isPlaying, (play) => {
    if (videoRef.value) {
        if (play) {
             videoRef.value.play().catch(e => { /* Browser may prevent play, which is fine */ });
        } else {
            videoRef.value.pause();
        }
    }
}, { immediate: true }); // Added immediate: true to play on load if prop is set

const handleError = () => { error.value = true; };
</script>

<style>
.blurry-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
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