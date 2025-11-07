<template>
    <HeaderNavMobile />
    <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
        <!-- 
            The SideNav is now a fixed, primary part of the layout on desktop.
            It's also theme-compliant.
        -->
        <aside class="hidden md:block w-20 xl:w-72 fixed top-0 left-0 h-full z-20 bg-white border-r border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 scrollbar-hide">
            <SideNav @create="showPostModal = true" @open-search="showSearchOverlay = true" @open-notifications="showNotificationOverlay = true" />
        </aside>

        <!-- Main Content (with margin to offset the fixed sidebar) -->
        <main class="md:ml-20 xl:ml-72">
            <div class="flex max-w-full">
                <!-- 
                  THE FIX: Added padding (px-4 py-6) to the main content slot.
                  This ensures no content ever touches the screen edges on mobile.
                -->
                <div class="flex-1 min-w-0 h-screen overflow-y-auto scrollbar-hide px-4 py-6">
                    <div class="pb-16 md:pb-0">
                        <slot />
                    </div>
                </div>
                <aside class.bind="$attrs.class" class="hidden lg:block w-80 shrink-0 p-4 h-screen overflow-y-auto bg-white border-l border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 scrollbar-hide">
                    <slot name="right-sidebar" />
                </aside>
            </div>
        </main>
        
        <!-- Mobile navigation and modals -->
        <BottomNavMobile @create="showPostModal = true" @open-notifications="showNotificationOverlay = true" />
        
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
        
        <SearchOverlay :is-open="showSearchOverlay" @close="showSearchOverlay = false" />
        <NotificationOverlay :is-open="showNotificationOverlay" @close="showNotificationOverlay = false" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import BottomNavMobile from '~/layouts/children/BottomNavMobile.vue';
import SideNav from './children/SideNav.vue';
import CreateModal from '~/components/home/CreateModal.vue';
import PostUploadModal from '~/components/post/PostUploadModal.vue';
import StoryUploadModal from '~/components/stories/StoryModal.vue';
import QuickProductModal from '~/components/product/QuickProductModal.vue';
import SearchOverlay from '~/components/search/SearchOverLay.vue';
import NotificationOverlay from '~/components/notifications/NotificationOverlay.vue';
import { useLayoutData } from '~/composables/useLayoutData';
import { useCategoryStore, useUserStore } from '~/stores'; // Import useUserStore
import HeaderNavMobile from './children/HeaderNavMobile.vue';

const { data: layoutData, pending, refresh } = useLayoutData();

const showCreateModal = ref(false);
const showPostModal = ref(false);
const showStoryModal = ref(false);
const showQuickProductModal = ref(false);
const showSearchOverlay = ref(false);
const showNotificationOverlay = ref(false);

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

/**
 * THE FIX: This function now refreshes ALL relevant data caches
 * across the entire application, ensuring new content appears instantly.
 */
const handlePost = async () => {
    // 1. Close all modals
    showPostModal.value = false;
    showStoryModal.value = false;
    showQuickProductModal.value = false;

    // 2. Refresh all data caches in parallel
    await Promise.all([
        refreshNuxtData('layout-data'),    // Refreshes sidebars (stories, categories)
        refreshNuxtData('homepage-main'), // Refreshes the main homepage feed
        // Add other keys here if needed, e.g. 'discover-products'
    ]);
};

let refreshInterval: NodeJS.Timeout | null = null;
onMounted(() => {
    refreshInterval = setInterval(() => { refresh(); }, 300000);
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

