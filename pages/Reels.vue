<template>
  <HomeLayout>
    <!-- Main Reels Feed -->
    <div class="h-full w-full max-w-md mx-auto">
        <div v-if="pending && !reels.length" class="h-full flex items-center justify-center">
            <Icon name="eos-icons:loading" size="48" class="text-neutral-500" />
        </div>
        <div v-else-if="error" class="h-full flex flex-col items-center justify-center text-center p-6">
            <p class="mb-4 text-neutral-400">Could not load Reels.</p>
            <button @click="refresh()" class="px-6 py-2 bg-brand text-white rounded-full font-medium">Retry</button>
        </div>
        <div v-else-if="!reels.length" class="h-full flex flex-col items-center justify-center text-center p-6">
            <h2 class="text-2xl font-semibold text-neutral-300">No Reels Yet</h2>
        </div>

        <div v-else ref="reelsContainer" class="h-full w-full snap-y snap-mandatory overflow-y-auto">
            <ReelItem 
                v-for="(reel, index) in reels" 
                :key="reel.id"
                :reel="reel"
                :is-active="index === currentReelIndex"
                :index="index"
                @open-comments="openCommentsModal"
            />
            <div ref="loadMoreTrigger" class="h-10"></div>
        </div>
    </div>
    
    <!-- Modals -->
    <ProductChatModal v-if="commentProduct" :is-open="isCommentModalOpen" :product="commentProduct" @close="isCommentModalOpen = false" />

    <!-- Sidebar content for this page can be defined here -->
    <template #left-sidebar>
        <!-- You can choose to show the default SideNav or a custom one for Reels -->
    </template>
    <template #right-sidebar>
        <!-- Right sidebar can be empty or have other content -->
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useReelsStore } from '~/stores';
import HomeLayout from '~/layouts/HomeLayout.vue';
import ReelItem from '~/components/reels/ReelItem.vue';
import ProductChatModal from '~/components/chat/ProductChatModal.vue';
import type { IProduct } from '~/models';

const reelsStore = useReelsStore();
const { data, pending, error, refresh } = await useLazyAsyncData('reels-feed', () => reelsStore.fetchInitialReels());

const reels = computed(() => reelsStore.reels);
const currentReelIndex = ref(0);
const isCommentModalOpen = ref(false);
const commentProduct = ref<IProduct | null>(null);

const openCommentsModal = (product: IProduct) => {
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

