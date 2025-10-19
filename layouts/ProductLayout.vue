<template>
  <div class="min-h-screen bg-gray-50" id="mainlayout">
    <!-- Persistent Top Navigation for all screen sizes -->
    <AppHeader />

    <div class="flex justify-center mx-auto w-full px-2 sm:px-4 lg:px-6 max-w-[1440px]">
      
      <!-- DESKTOP SIDEBAR -->
      <div class="hidden lg:block w-70 shrink-0">
        <!-- <SideNavMain /> -->
      </div>

      <!-- MAIN CONTENT COLUMN -->
      <main class="flex-1 min-w-0 pt-16 lg:pt-20">
        <!-- Mobile Category Slider -->
        <TopMobileCategoryList class="lg:hidden" />
        
        <!-- Advertisement Section -->
        <!-- <AdvertSection class="mt-4" /> -->
        
        <!-- ProductLayout is rendered here via the slot -->
       <div v-if="displayedProducts.length > 0" id="product-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-4">
      <div 
        v-for="product in displayedProducts" 
        :key="product.slug"
        class="animate-fade-in"
      >
        <ProductCard :product="product" class="h-full" />
      </div>
    </div>

        <!-- Empty State (only shows if the list is truly empty after loading) -->
    <div v-else-if="!productStore.isLoading" class="flex flex-col items-center justify-center py-20 text-center">
      <Icon name="mdi:package-variant-remove" class="h-12 w-12 text-gray-400 mb-4" />
      <p class="text-gray-600 font-medium">{{ emptyStateMessage }}</p>
    </div>

    <!-- Infinite Scroll Trigger -->
    <div ref="loadMoreTrigger" class="h-1 w-full mt-8"></div>
    <div v-if="productStore.isLoading && displayedProducts.length > 0" class="flex justify-center py-8">
        <Loading class="h-8 w-8 text-brand" />
    </div>
      </main>
    </div>

    <!-- DESKTOP CHAT PANEL (Right Side) -->
    <div class="hidden lg:block">
      <!-- Collapsible Chat Window -->
      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in"
        enter-from-class="translate-x-full"
        leave-to-class="translate-x-full"
      >
        <Chat 
          v-if="isChatOpen"
          class="fixed top-0 right-0 w-96 h-screen border-l bg-white z-50"
          @close="isChatOpen = false" 
        />
      </transition>
      
      <!-- Floating Button to Open Chat -->
      <button 
        v-if="!isChatOpen"
        @click="isChatOpen = true"
        class="fixed bottom-6 right-6 bg-brand text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-[#df4949] transition-transform hover:scale-110 z-40"
        aria-label="Open AI Chat"
      >
        <Icon name="mdi:chat-processing-outline" size="28" />
      </button>
    </div>

    <!-- MOBILE CHAT (Modal) -->
    <div v-if="isMobileChatOpen" class="lg:hidden">
      <div @click="isMobileChatOpen = false" class="fixed inset-0 bg-black/40 z-40"></div>
      <Chat 
        class="fixed bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl z-50"
        @close="isMobileChatOpen = false"
      />
    </div>

    <!-- MOBILE FLOATING NAVIGATION -->
    <FloatingNavMobile @open-chat="isMobileChatOpen = true" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TopMobileCategoryList from '@/layouts/children/TopMobileCategory.vue'
import Chat from '@/components/chat/AIChat.vue';
import SideNavMain from './children/SideNavMain.vue';
import AdvertSection from '@/components/AdvertSection.vue';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import FloatingNavMobile from '../layouts/children/FloatingNavMobile.vue';
import AppHeader from './children/AppHeader.vue';

const productStore = useProductStore();

const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// This component is now "dumb". It just reads the active product list from the store.
const displayedProducts = computed(() => productStore.activeProductList);

const emptyStateMessage = computed(() => {
  return productStore.currentCategorySlug
    ? `No products found in this category.`
    : 'No products available at the moment.';
});

const loadMore = async () => {
  if (productStore.isLoading || !productStore.hasMoreProducts) return;
  await productStore.fetchMoreProducts();
};



// State for desktop chat panel
const isChatOpen = ref(false);
// State for mobile chat modal
const isMobileChatOpen = ref(false);
onMounted(() => {
    const options = { root: null, rootMargin: '200px', threshold: 0.1 };
    observer.value = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMore();
        }
    }, options);
    
    if (loadMoreTrigger.value) {
        observer.value.observe(loadMoreTrigger.value);
    }
});

onUnmounted(() => {
    if(observer.value) {
        observer.value.disconnect();
    }
});
</script>

<style>
@keyframes fadeIn {
 from { opacity: 0; transform: translateY(10px); }
 to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
 animation: fadeIn 0.3s ease-out forwards;
}
</style>