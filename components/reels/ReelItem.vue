<template>
    <div class="h-dvh w-full snap-start relative flex justify-center items-center product-slide" :data-index="index">
        <ReelPlayer :media="reel.media" :is-active="isActive" />
        <div class="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div class="flex items-end gap-4">
                <ReelInfoOverlay :seller="reel.seller" :product="reel.product" />
                <ReelActions v-if="reel.product" :product="reel.product" @open-comments="$emit('open-comments', reel.product)" />
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
