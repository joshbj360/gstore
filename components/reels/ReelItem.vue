<template>
  <div class="w-full flex justify-center" :data-index="index">
    <!-- Make this container relative -->
    <div class="relative aspect-[9/16] w-[90%] sm:w-[400px] max-w-sm bg-black/60 rounded-xl overflow-hidden shadow-lg border border-neutral-800">
      
      <!-- Video Player -->
      <ReelPlayer :media="reel.media" :is-active="isActive" />

      <!-- Overlay text + actions -->
      <div class="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
        <div class="flex items-end gap-4 text-[3vw] sm:text-sm md:text-base">
          <ReelInfoOverlay :item="reel" />
          <ReelActions
            v-if="reel.product"
            :product="reel.product"
            @open-comments="$emit('open-comments', reel.product)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ReelPlayer from './ReelPlayer.vue';
import ReelInfoOverlay from './ReelInfoOverlay.vue';
import ReelActions from './ReelActions.vue';
defineProps(['reel', 'isActive', 'index']);
defineEmits(['open-comments']);
</script>
