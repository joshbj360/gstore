<template>
  <div 
    class="w-full max-w-sm mx-auto bg-gray-100 dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-neutral-800 relative aspect-[9/16]" 
    :style="reelHeightStyle"
    :data-index="index"
  >
    
    <ReelPlayer :media="reel.media" :is-active="isActive" class="w-full h-full" />

    <div class="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
      <div class="flex items-end gap-4">
        <ReelInfoOverlay :item="reel" />
        <ReelActions
          v-if="reel.product"
          :product="reel.product"
          @open-comments="$emit('open-comments', reel.product)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ReelPlayer from './ReelPlayer.vue';
import ReelInfoOverlay from './ReelInfoOverlay.vue';
import ReelActions from './ReelActions.vue';

defineProps(['reel', 'isActive', 'index']);
defineEmits(['open-comments']);

// This CSS variable calculates the max height of the reel
// (Viewport Height - 3.5rem Top Nav - 3.5rem Bottom Nav - 2rem padding)
const reelHeightStyle = computed(() => ({
  'max-height': 'calc(100dvh - 9rem)'
}));
</script>