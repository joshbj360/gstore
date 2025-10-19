<template>
    <div class="h-dvh w-full bg-black flex items-center justify-center text-white">
        <div v-if="pending" class="text-center py-8">
            <Icon name="mdi:loading" size="32" spin class="text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-400">Loading Story...</p>
        </div>
        
        <div v-else-if="error || !stories || stories.length === 0" class="text-center py-8 px-4">
            <Icon name="mdi:heart-broken" size="32" class="text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-400 mb-2">This story couldn't load or has expired.</p>
            <button @click="refresh" class="text-blue-400 hover:underline text-sm mr-2">Retry</button>
            <NuxtLink to="/" class="text-blue-400 hover:underline text-sm">Go Home</NuxtLink>
        </div>

        <div v-else class="relative h-full w-full max-w-md bg-black" ref="swipeRef" role="region" aria-label="Story Viewer">
            <!-- Progress Bars -->
            <StoryProgressBar :stories="stories" :current-index="currentStoryIndex" :progress="storyProgress" />
            
            <!-- Close Button (ARIA-Friendly) -->
            <button @click="closeStory" class="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-white/50" aria-label="Close Story Viewer">
                <Icon name="mdi:close" size="24" />
            </button>
            
            <!-- Carousel for Stories -->
            <Carousel v-model="currentStoryIndex" :items-to-show="1" :mouse-drag="false" :touch-drag="false" class="h-full" @slide-end="onSlideEnd">
                <Slide v-for="(story, index) in stories" :key="story.id">
                    <div class="relative w-full h-full">
                        <MediaDisplay 
                            :product-media="story.media" 
                            :is-playing="index === currentStoryIndex" 
                            @ended="nextStory"
                            class="absolute inset-0 w-full h-full object-contain" 
                            loading="lazy"
                        />
                        
                        <!-- Header: Seller Link -->
                        <div class="absolute top-10 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
                            <NuxtLink :to="`/seller/profile/${story.seller.store_slug}`" class="flex items-center gap-2" aria-label="View Seller Profile">
                                <img :src="story.seller.store_logo || '/default-avatar.png'" class="w-8 h-8 rounded-full object-cover" loading="lazy" alt="Seller Avatar" />
                                <span class="font-semibold text-sm truncate">{{ story.seller.store_name }}</span>
                            </NuxtLink>
                        </div>
                        
                        <!-- CTA: Shop Now -->
                        <NuxtLink v-if="story.product" :to="`/product/${story.product.slug}`" class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-white/95 text-black rounded-full font-semibold shadow-lg backdrop-blur-sm hover:bg-white transition-all duration-200" aria-label="Shop This Product">
                            Shop Now
                        </NuxtLink>
                    </div>
                </Slide>
            </Carousel>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSwipe } from '@vueuse/core';
import { useStoryStore } from '~/stores';
import 'vue3-carousel/dist/carousel.css';
import MediaDisplay from '~/components/product/productDetails/mediaSection/MediaDisplay.vue';
import StoryProgressBar from '~/components/stories/StoryProgressBar.vue';

const route = useRoute();
const router = useRouter();
const storyStore = useStoryStore();

const storyId = route.params.storyId as string;

const { data: stories, pending, error, refresh } = await useAsyncData(
    `story-feed-${storyId}`,
    () => storyStore.fetchStoryFeed(storyId),
    {
        default: () => [],
    }
);

const currentStoryIndex = ref(0);
const storyProgress = ref(0);
let progressInterval: NodeJS.Timeout | null = null;
const swipeRef = ref<HTMLElement | null>(null);

// SSR-Safe Initial Index: Watch stories for sync set
watch(stories, (newStories) => {
    if (newStories && newStories.length) {
        const initialIndex = newStories.findIndex(s => s.id === storyId);
        currentStoryIndex.value = initialIndex !== -1 ? initialIndex : 0;
    }
}, { immediate: true });

const advanceStory = (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' ? currentStoryIndex.value + 1 : currentStoryIndex.value - 1;
    if (stories.value && newIndex >= 0 && newIndex < stories.value.length) {
        currentStoryIndex.value = newIndex;
    } else if (direction === 'next') {
        closeStory();
    }
};

const nextStory = () => advanceStory('next');
const prevStory = () => advanceStory('prev');

const closeStory = () => {
    if (window.history.length > 2) {
        router.back();
    } else {
        router.push('/');
    }
};

// Swipe Gestures (Threshold for Accidental Prevention)
useSwipe(swipeRef, {
    onSwipeStart: () => {
        if (progressInterval) clearInterval(progressInterval);
    },
    onSwipeEnd: (e, direction) => {
        if (direction === 'left') nextStory();
        if (direction === 'right') prevStory();
    },
    threshold: 50, // Pixels to commit swipe
});

const onSlideEnd = (index: number) => {
    if (index === stories.value!.length - 1) {
        closeStory();
    }
};

// Progress Timer
watch(currentStoryIndex, (newIndex) => {
    if (progressInterval) clearInterval(progressInterval);
    storyProgress.value = 0;

    const currentStory = stories.value?.[newIndex];
    if (currentStory?.media.type === 'IMAGE') {
        const duration = 5000; // 5s for images
        let startTime = Date.now();
        progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            storyProgress.value = Math.min((elapsed / duration) * 100, 100);
            if (elapsed >= duration) {
                clearInterval(progressInterval!);
                nextStory();
            }
        }, 50);
    } else {
        progressInterval = null;
    }
}, { immediate: true });

// Keyboard Nav for Accessibility
onMounted(() => {
    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') prevStory();
        if (e.key === 'ArrowRight') nextStory();
        if (e.key === 'Escape') closeStory();
    };
    window.addEventListener('keydown', handleKeydown);
    onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
});

// Cleanup
onUnmounted(() => {
    if (progressInterval) clearInterval(progressInterval);
});
</script>