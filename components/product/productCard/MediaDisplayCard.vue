<template>
  <div class="w-full h-full bg-gray-200">
    <img 
      v-if="productMedia?.type === EMediaType.VIDEO" 
      :src="videoThumbnail" 
      alt="Product video thumbnail"
      class="w-full h-full object-cover" 
      loading="lazy"
    />
    <img 
      v-else-if="productMedia?.type === EMediaType.IMAGE"
      :src="productMedia.url" 
      :alt="productMedia.altText || 'Product image'"
      class="w-full h-full object-cover" 
      loading="lazy"
    />
    <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
      <Icon name="mdi:image-off-outline" size="24" class="text-gray-400" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import { type IMedia, EMediaType } from '~/models/interface/';

const props = defineProps({
  productMedia: {
    type: Object as PropType<IMedia>,
    default: null,
  },
});


// For Cloudinary videos, we can generate a thumbnail URL by changing the extension to .jpg
const videoThumbnail = computed(() => {
    if (props.productMedia?.type === EMediaType.VIDEO && props.productMedia.url.includes('cloudinary')) {
        const thumbnailUrl = props.productMedia.url.replace(/\.\w+$/, '.jpg');
        console.log(thumbnailUrl); //TODO: Implement video thumbnail generation
        return thumbnailUrl;
    }
    // A generic fallback for other video types
    return 'https://placehold.co/300x300/e2e8f0/4a5568?text=Video';
});
</script>