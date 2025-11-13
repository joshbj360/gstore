<template>
    <div class="w-full h-full bg-black">
        <video
            v-if="media.type === 'VIDEO'"
            ref="videoRef"
            :src="media.url"
            class="w-full h-full object-cover"
            autoplay
            muted
            loop
            playsinline
            :poster="getMediaThumbnailUrl(media)"
        ></video>
        <img v-else :src="media.url" class="w-full h-full object-cover" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { IMedia } from '~/models';
import { getMediaThumbnailUrl } from '~/utils/formatters'; // Import the formatter

const props = defineProps<{
    media: IMedia;
    isActive: boolean;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);

watch(() => props.isActive, (active) => {
    if (videoRef.value) {
        if (active) {
            // Play video when it becomes active
            videoRef.value.play().catch(() => {
                // Autoplay might be blocked, which is fine.
            });
        } else {
            // Pause video when it's no longer active
            videoRef.value.pause();
            videoRef.value.currentTime = 0; // Rewind
        }
    }
}, { immediate: true });
</script>