<template>
  <HomeLayout>
    <div class="py-8">
      
      <div v-if="pending && !reels.length" class="py-20 flex justify-center">
        <Icon name="eos-icons:loading" size="48" class="text-brand" />
      </div>

      <div v-else-if="error" class="py-20 text-center">
        <p class="mb-4 text-gray-500 dark:text-neutral-400">Could not load Reels.</p>
        <button @click="refresh()" class="px-6 py-2 bg-brand text-white rounded-full font-medium">Retry</button>
      </div>

      <div v-else-if="!reels.length" class="py-20 text-center">
        <h2 class="text-2xl font-semibold text-gray-700 dark:text-neutral-300">No Reels Yet</h2>
      </div>

      <div v-else ref="reelsContainer" class="space-y-8" role="main" aria-label="Reels Feed">
        <ReelItem
          v-for="(reel, index) in reels"
          :key="reel.id"
          :reel="reel"
          :is-active="index === currentReelIndex" 
          :index="index"
          @open-comments="openCommentsModal"
          class="reel-item"
          :data-index="index"
        />

        <div ref="loadMoreTrigger" class="h-16"></div>
      </div>
    </div>

    <ProductChatModal v-if="commentProduct" :is-open="isCommentModalOpen" :product="commentProduct" @close="isCommentModalOpen = false" />
    <ProductDetailModal :product="selectedProduct" @close="selectedProduct = null" />
    
    <template #left-sidebar></template>
    <template #right-sidebar></template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useReelsStore } from '~/stores';
import ReelItem from '~/components/reels/ReelItem.vue';
import ProductChatModal from '~/components/chat/ProductCommentModal.vue';
import ProductDetailModal from '~/components/home/ProductDetailModal.vue';
import type { IProduct, IReel } from '~/models';
import HomeLayout from '~/layouts/HomeLayout.vue'; 
import { useRouter } from 'vue-router'; 

const router = useRouter(); 
const reelsStore = useReelsStore();
const { data, pending, error, refresh } = await useLazyAsyncData('reels-feed', () => reelsStore.fetchInitialReels());

const reels = computed(() => reelsStore.reels);
const currentReelIndex = ref(0);
const isCommentModalOpen = ref(false);
const commentProduct = ref<IProduct | null>(null);
const selectedProduct = ref<IProduct | null>(null); 

const openCommentsModal = (product: IProduct) => {
    commentProduct.value = product;
    isCommentModalOpen.value = true;
};

const openProductModal = (item: IProduct) => {
    selectedProduct.value = item;
};

// --- Intersection Observer for Active Reel & Infinite Scroll ---
const reelsContainer = ref<HTMLElement | null>(null);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

const setupObservers = () => {
  if (observer.value) observer.value.disconnect();
  
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
  }, { 
    root: null, 
    threshold: 0.5 
  });
  
  reelsContainer.value?.querySelectorAll('.reel-item').forEach(el => observer.value?.observe(el));
  if (loadMoreTrigger.value) observer.value?.observe(loadMoreTrigger.value);
};

onMounted(setupObservers);

watch(reels, async () => {
    await nextTick();
    setupObservers(); 
}, { deep: true });

onUnmounted(() => {
    if (observer.value) observer.value.disconnect();
});
</script>

<style scoped>
/* No page-specific snap scrolling is needed. */
</style>