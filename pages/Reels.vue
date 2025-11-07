<template>
    <HomeLayout>
    <!-- 
      THE FIX: This is a full-screen, immersive layout.
      It does NOT use the HomeLayout.
    -->
    <div class="min-h-screen bg-black text-white overflow-hidden">
        <!-- Header: Minimalist and contextual -->
        <header class="absolute top-0 left-50 right-0 z-10 p-4 flex items-center justify-between">
            <NuxtLink to="/" class="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors">
                <Icon name="mdi:arrow-left" size="24" />
            </NuxtLink>
            <h1 class="text-lg font-bold">Reels</h1>
            <div class="w-10"></div> <!-- Spacer -->
        </header>

        <!-- Loading State -->
        <div v-if="pending && !reels.length" class="h-dvh flex items-center justify-center">
            <Icon name="eos-icons:loading" size="48" class="text-neutral-500" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="h-dvh flex flex-col items-center justify-center text-center p-6">
            <p class="mb-4 text-neutral-400">Could not load Reels.</p>
            <button @click="refresh()" class="px-6 py-2 bg-brand text-white rounded-full font-medium">Retry</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="!reels.length" class="h-dvh flex flex-col items-center justify-center text-center p-6">
            <h2 class="text-2xl font-semibold text-neutral-300">No Reels Yet</h2>
        </div>

        <div v-else ref="reelsContainer"
            class="h-dvh w-full snap-y snap-mandatory overflow-y-auto scrollbar-hide bg-black flex flex-col items-center py-10 space-y-10"
            role="main" aria-label="Reels Feed">
            <ReelItem v-for="(reel, index) in reels" :key="reel.id" :reel="reel" :is-active="index === currentReelIndex"
                :index="index" @open-comments="openCommentsModal"
                class="reel-item snap-start flex justify-center items-center" :data-index="index" />

            <!-- Infinite scroll trigger -->
            <div ref="loadMoreTrigger" class="h-16"></div>
        </div>


    </div>

    <!-- Modals -->
    <ProductChatModal v-if="commentProduct" :is-open="isCommentModalOpen" :product="commentProduct"
        @close="isCommentModalOpen = false" />
    <ProductDetailModal :product="selectedProduct" @close="selectedProduct = null" />
    </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useReelsStore } from '~/stores';
import ReelItem from '~/components/reels/ReelItem.vue';
import ProductChatModal from '~/components/chat/ProductChatModal.vue';
import ProductDetailModal from '~/components/home/ProductDetailModal.vue';
import HomeLayout from '~/layouts/HomeLayout.vue';
import type { IProduct, IReel } from '~/models';

// This ensures the page is fully immersive and does NOT use the 3-column layout

const reelsStore = useReelsStore();
const { data, pending, error, refresh } = await useLazyAsyncData('reels-feed', () => reelsStore.fetchInitialReels());

const reels = computed(() => reelsStore.reels);
const currentReelIndex = ref(0);
const isCommentModalOpen = ref(false);
const commentProduct = ref<IProduct | null>(null);
const selectedProduct = ref<IProduct | null>(null); // For the product detail modal

const openCommentsModal = (product: IProduct) => {
    commentProduct.value = product;
    isCommentModalOpen.value = true;
};

// This is triggered by ReelItem, which passes up the *entire* reel object
const openProductModal = (item: IProduct) => {
    selectedProduct.value = item;
};

// --- Intersection Observer for Active Reel & Infinite Scroll ---
const reelsContainer = ref<HTMLElement | null>(null);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

const setupObservers = () => {
    if (!observer.value) return;
    observer.value.disconnect();
    reelsContainer.value?.querySelectorAll('.reel-item').forEach(el => observer.value?.observe(el));
    if (loadMoreTrigger.value) observer.value.observe(loadMoreTrigger.value);
};

onMounted(() => {
    observer.value = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target === loadMoreTrigger.value) {
                    reelsStore.fetchMoreReels();
                } else {
                    currentReelIndex.value = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                }
            }
        });
    }, { root: reelsContainer.value, threshold: 0.7 });

    setupObservers();
});

// Watch for new reels being added by the infinite scroll
watch(reels, async () => {
    await nextTick(); // Wait for the DOM to update
    setupObservers(); // Re-observe all elements
}, { deep: true });

onUnmounted(() => {
    if (observer.value) observer.value.disconnect();
});
</script>

<style scoped>
/* Use `h-dvh` for dynamic viewport height, fixes mobile browser UI bars */
.h-dvh {
    height: 100dvh;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
</style>
