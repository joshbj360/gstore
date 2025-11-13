<template>
  <HeaderNavMobile />

  <div
    class="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300"
  >
    <!-- LEFT SIDEBAR -->
    <aside
      class="hidden md:block w-20 xl:w-72 fixed top-0 left-0 h-full z-20 bg-white border-r border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 scrollbar-hide"
    >
      <SideNav
        @create="showCreateModal = true"
        @open-search="showSearchOverlay = true"
        @open-notifications="showNotificationOverlay = true"
      />
    </aside>

    <!-- MAIN CONTENT + RIGHT SIDEBAR -->
   <main class="md:ml-20 xl:ml-72">
    <div class="flex max-w-[1500px] mx-auto">
      
      <div
        class="flex-1 min-w-0 h-[92vh] overflow-y-auto scrollbar-hide px-2 sm:px-6 py-6"
        :class="{ 'max-w-2xl mx-auto': !isWidePage }"
      >
        <div class="pb-16 md:pb-0">
          <slot />
        </div>
      </div>

      <aside
                  class="hidden lg:block w-[420px] shrink-0 p-4 h-[92vh] overflow-y-auto bg-white border-l border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 scrollbar-hide"
                >
                    
                    <LinkedAccessories 
                        v-if="isProductPage && currentProduct" 
                        :productId="currentProduct.id" 
                    />
                    
                    <slot name="right-sidebar" />
                </aside>
    </div>
  </main>

    <!-- MOBILE NAVIGATION -->
    <BottomNavMobile
      @create="showCreateModal = true"
      @open-notifications="showNotificationOverlay = true"
    />

    <!-- MODALS -->
    <CreateModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @open-post-modal="openPostUploader"
      @open-story-modal="openStoryUploader"
      @open-product-modal="openQuickProductUploader"
    />
    <PostUploadModal
      :is-open="showPostModal"
      @close="showPostModal = false"
      @posted="handlePost"
    />
    <StoryUploadModal
      :is-open="showStoryModal"
      @close="showStoryModal = false"
      @posted="handlePost"
    />
    <QuickProductModal
      :is-open="showQuickProductModal"
      @close="showQuickProductModal = false"
      @posted="handlePost"
    />

    <!-- OVERLAYS -->
    <SearchOverlay
      :is-open="showSearchOverlay"
      @close="showSearchOverlay = false"
    />
    <NotificationOverlay
      :is-open="showNotificationOverlay"
      @close="showNotificationOverlay = false"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import BottomNavMobile from '~/layouts/children/BottomNavMobile.vue';
import SideNav from './children/SideNav.vue';
import CreateModal from '~/components/home/CreateModal.vue';
import PostUploadModal from '~/components/post/PostUploadModal.vue';
import StoryUploadModal from '~/components/stories/StoryModal.vue';
import QuickProductModal from '~/components/product/QuickProductModal.vue';
import SearchOverlay from '~/components/search/SearchOverLay.vue';
import NotificationOverlay from '~/components/notifications/NotificationOverlay.vue';
import { useLayoutData } from '~/composables/useLayoutData';
import HeaderNavMobile from './children/HeaderNavMobile.vue';
import { useCategoryStore, useUserStore, useProductStore } from '~/stores';
import RightSideNav from '~/layouts/children/RightSideNav.vue';
import LinkedAccessories from '~/components/accessories/LinkedAccesories.vue';

const { refresh } = useLayoutData();
const route = useRoute();
// THE FIX: Get the product store and check the current route
const productStore = useProductStore();
const isProductPage = computed(() => route.name === 'product-slug');
const currentProduct = computed(() => productStore.currentProduct);

const showCreateModal = ref(false);
const showPostModal = ref(false);
const showStoryModal = ref(false);
const showQuickProductModal = ref(false);
const showSearchOverlay = ref(false);
const showNotificationOverlay = ref(false);
const isWidePage = computed(() => !!route.meta.isWidePage);

const openPostUploader = () => {
  showCreateModal.value = false;
  showPostModal.value = true;
};
const openStoryUploader = () => {
  showCreateModal.value = false;
  showStoryModal.value = true;
};
const openQuickProductUploader = () => {
  showCreateModal.value = false;
  showQuickProductModal.value = true;
};

const handlePost = async () => {
  showPostModal.value = false;
  showStoryModal.value = false;
  showQuickProductModal.value = false;
  await Promise.all([
    refreshNuxtData('layout-data'),
    refreshNuxtData('homepage-main'),
  ]);
};

let refreshInterval: NodeJS.Timeout | null = null;
onMounted(() => {
  refreshInterval = setInterval(() => {
    refresh();
  }, 300000);
});
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
