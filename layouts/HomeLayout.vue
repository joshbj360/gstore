<template>
    <!-- 
      THE FIX: This layout is now theme-compliant.
      - Defaults to light mode (bg-gray-50)
      - Adds `dark:` prefixes for your dark theme (dark:bg-neutral-950)
    -->
    <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
        <!-- 
            The SideNav is now a fixed, primary part of the layout on desktop.
            It's also theme-compliant.
        -->
        <aside class="hidden md:block w-20 xl:w-72 fixed top-0 left-0 h-full z-20 bg-white border-r border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 scrollbar-hide">
            <SideNav 
                @create="showCreateModal = true" 
                @open-search="showSearchOverlay = true" 
                @open-notifications="showNotificationOverlay=true"
            />
        </aside>

        <!-- Main Content (with margin to offset the fixed sidebar) -->
        <main class="md:ml-20 xl:ml-72">
            <div class="flex max-w-full">
                <div class="flex-1 min-w-0 h-screen overflow-y-auto scrollbar-hide">
                    <div class="pb-16 md:pb-0">
                        <slot />
                    </div>
                </div>
                <!-- 
                  Right Sidebar
                  THE FIX: Now theme-compliant.
                -->
                <aside class="hidden lg:block w-80 shrink-0 p-4 h-screen overflow-y-auto bg-white border-l border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 scrollbar-hide">
                    <slot name="right-sidebar" />
                </aside>
            </div>
        </main>
        
        <!-- Mobile navigation and modals -->
        <BottomNavMobile @create="showPostModal = true" />
        <PostUploadModal :is-open="showPostModal" @close="showPostModal = false" @posted="handlePost" />
        <CreateModal 
            :is-open="showCreateModal" 
            @close="showCreateModal = false" 
            @open-post-modal="openPostUploader"
            @open-story-modal="openStoryUploader"
            @open-product-modal="openQuickProductUploader"
        />
        <QuickProductModal
            :is-open="showQuickProductModal"
            @close="showQuickProductModal = false"
            @posted="handlePost"
        />
        <SearchOverlay :is-open="showSearchOverlay" @close="showSearchOverlay = false " />
        <NotificationOverlay :is-open="showNotificationOverlay" @close="showNotificationOverlay=false" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BottomNavMobile from '~/layouts/children/BottomNavMobile.vue';
import SideNav from './children/SideNav.vue';
import PostUploadModal from '~/components/post/PostUploadModal.vue';
import SearchOverlay from '~/components/search/SearchOverLay.vue';
import CreateModal from '~/components/home/CreateModal.vue';
import QuickProductModal from '~/components/product/QuickProductModal.vue';
import NotificationOverlay from '~/components/notifications/NotificationOverlay.vue';

const showPostModal = ref(false);
const showCreateModal = ref(false);
const showStoryModal = ref(false);
const showQuickProductModal = ref(false);
const showSearchOverlay = ref(false); 
const showNotificationOverlay = ref(false)

const handlePost = () => {
    // We can add logic here if needed, e.g., refresh the main feed
    showPostModal.value = false;
};
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

