<template>
    <div class="min-h-screen bg-black text-white overflow-hidden">
        <header class="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
            <NuxtLink to="/" class="p-2 rounded-full bg-black/30 hover:bg-black/50"><Icon name="mdi:arrow-left" size="24" /></NuxtLink>
            <h1 class="text-lg font-bold">Reels</h1>
            <div class="w-10"></div> <!-- Spacer -->
        </header>
        
        <div v-if="pending && !reels.length" class="h-dvh flex items-center justify-center">
            <Icon name="eos-icons:loading" size="48" class="text-gray-400" />
        </div>
        <div v-else-if="error" class="h-dvh flex flex-col items-center justify-center text-center p-6">
            <p class="mb-4">Could not load Reels.</p>
            <button @click="refresh()" class="px-6 py-2 bg-[#f02c56] text-white rounded-full font-medium">Retry</button>
        </div>
        <div v-else-if="!reels.length" class="h-dvh flex flex-col items-center justify-center text-center p-6">
            <h2 class="text-2xl font-semibold">No Reels Yet</h2>
        </div>

        <div v-else ref="reelsContainer" class="h-dvh w-full snap-y snap-mandatory overflow-y-auto">
            <ReelItem 
                v-for="(reel, index) in reels" 
                :key="reel.id"
                :reel="reel"
                :is-active="index === currentReelIndex"
                :index="index"
                @open-comments="openComments"
            />
            <div ref="loadMoreTrigger" class="h-10"></div>
        </div>

        <ProductChatModal v-if="commentProduct" :is-open="isCommentModalOpen" :product="commentProduct" @close="isCommentModalOpen = false" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useReelsStore } from '~/stores';
import ReelItem  from '~/components/reels/ReelItem.vue'
import ProductChatModal from '~/components/chat/ProductChatModal.vue';
import type { IProduct } from '~/models';

definePageMeta({ layout: false });

const reelsStore = useReelsStore();
const { data, pending, error, refresh } = await useAsyncData('initial-reels', () => reelsStore.fetchInitialReels());

const reels = computed(() => reelsStore.reels);
const currentReelIndex = ref(0);
const isCommentModalOpen = ref(false);
const commentProduct = ref<IProduct | null>(null);

const openComments = (product: IProduct) => {
    commentProduct.value = product;
    isCommentModalOpen.value = true;
};

// --- Intersection Observer for Active Reel & Infinite Scroll ---
const reelsContainer = ref<HTMLElement | null>(null);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

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
    
    reelsContainer.value?.querySelectorAll('.product-slide').forEach(el => observer.value?.observe(el));
    if(loadMoreTrigger.value) observer.value.observe(loadMoreTrigger.value);
});

onUnmounted(() => {
    observer.value?.disconnect();
});
</script>

