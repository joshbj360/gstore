<template>
    <div class="w-full h-full bg-neutral-800">
        <video
            v-if="media.type === 'VIDEO'"
            ref="videoRef"
            :src="media.url"
            class="w-full h-full object-cover"
            muted
            loop
            playsinline
            :poster="getMediaThumbnailUrl(media)" 
        ></video>
        <img v-else :src="media.url" class="w-full h-full object-cover" :alt="altText" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { IMedia } from '~/models';
import { getMediaThumbnailUrl } from '~/utils/formatters';

const props = defineProps<{
    media: IMedia;
    altText?: string;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// This is a professional optimization:
// The video will only play when it is more than 50% visible on the screen.
onMounted(() => {
    if (videoRef.value) {
        observer.value = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.value?.play().catch(() => {});
                } else {
                    videoRef.value?.pause();
                }
            },
            { threshold: 0.5 }
        );
        observer.value.observe(videoRef.value);
    }
});

onUnmounted(() => {
    if (observer.value) {
        observer.value.disconnect();
    }
});
</script>
