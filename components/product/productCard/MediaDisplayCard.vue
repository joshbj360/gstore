<template>
  <div id="media-card-display" class="w-full h-full flex items-center justify-center bg-gray-50">
    <!-- VIDEO thumbnail / autoplay muted -->
    <video
      v-if="!hasError && productMedia?.type === 'VIDEO'"
      :src="productMedia.url"
      muted
      playsinline
      loop
      class="w-full h-full object-cover object-top transition-transform duration-200"
      @error="hasError = true"
    ></video>

    <!-- IMAGE -->
    <img
      v-else-if="!hasError && productMedia?.type === 'IMAGE'"
      :src="productMedia.url"
      :alt="`Product image ${productMedia.id || ''}`"
      class="w-full h-full object-cover object-top transition-transform duration-200"
      loading="lazy"
      @error="hasError = true"
    />

    <!-- FALLBACK (if error or no media) -->
    <div
      v-else
      class="flex items-center justify-center text-gray-400 text-xs bg-gray-100 w-full h-full"
    >
      <Icon name="mdi:image-off" class="w-6 h-6" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'
import type { MediaInterface } from '~/models/interface/products/media.interface'

const props = defineProps({
  productMedia: {
    type: Object as PropType<MediaInterface>,
    default: null
  }
})


const hasError = ref(false)
</script>
