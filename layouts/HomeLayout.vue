<template>
    <div class="min-h-screen bg-neutral-950 text-neutral-100">
        <AppHeader />
        <!-- 
            This is now a full-width, three-column layout,
            which is the professional standard for social media-inspired feeds.
        -->
        <div class="flex max-w-full">
             <!-- 
                Left Sidebar (fixed width)
                This slot is for primary navigation like Top Shops and Categories.
            -->
            <aside
                class="hidden md:block w-72 shrink-0 p-4 h-[calc(100vh-56px)] overflow-y-auto border-r border-neutral-800 scrollbar-hide"
            >
                <!-- THE FIX: The layout now fetches its own data via the composable -->
                <div v-if="pending" class="space-y-4 animate-pulse">
                    <div class="h-6 w-1/3 bg-neutral-800 rounded"></div>
                    <div v-for="i in 4" :key="i" class="flex items-center space-x-3 p-2">
                        <div class="w-8 h-8 rounded-full bg-neutral-800"></div>
                        <div class="flex-1 space-y-2">
                            <div class="h-4 w-3/4 bg-neutral-700 rounded"></div>
                        </div>
                    </div>
                </div>
                 <SideNav v-else-if="layoutData" :top-sellers="layoutData.topSellers" :categories="categories" />
            </aside>

             <!-- Main Content (takes up all available space) -->
            <main class="flex-1 min-w-0 h-[calc(100vh-56px)] overflow-y-auto scrollbar-hide">
                <!-- Add padding-bottom to account for the mobile nav bar -->
                <div class="pb-16 md:pb-0">
                    <slot />
                </div>

            </main>

            <!-- 
                Right Sidebar (fixed width)
                This slot is for secondary, discovery-oriented content like accessories.
            -->
            <aside
                class="hidden lg:block w-80 shrink-0 p-4 h-[calc(100vh-56px)] overflow-y-auto border-l border-neutral-800 scrollbar-hide"
            >
                <slot name="right-sidebar" />
            </aside>
        </div>
        <BottomNavMobile />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import AppHeader from '~/layouts/children/AppHeader.vue';
import BottomNavMobile from '~/layouts/children/BottomNavMobile.vue';
import SideNav from './children/SideNav.vue';
import { useLayoutData } from '@/composables/useLayoutData';
import { useCategoryStore } from '@/stores';

// THE FIX: We now get the `refresh` function from our composable.
const { data: layoutData, pending, refresh } = useLayoutData();

const categoryStore = useCategoryStore();
// Ensure these computed values always return arrays (fallback to empty arrays)
// so the SideNav prop types receive ICategory[] and not undefined.
const topSellers = computed(() => layoutData.value?.topSellers ?? []);
const categories = computed(() => categoryStore.categories ?? []);

let refreshInterval: NodeJS.Timeout | null = null;

onMounted(() => {
    console.log(topSellers.value, categories.value);
    // Set up an interval to refresh the layout data every 5 minutes (300,000 ms)
    refreshInterval = setInterval(() => {
        refresh();
    }, 300000);
});

onUnmounted(() => {
    // It's crucial to clear the interval when the layout is destroyed to prevent memory leaks
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
</script>
<style scoped>
.scrollbar-hide {
    /* For Firefox */
    scrollbar-width: none;
    /* For Internet Explorer and Edge */
    -ms-overflow-style: none;
}

.scrollbar-hide::-webkit-scrollbar {
    /* For Chrome, Safari, and Opera */
    display: none;
}
</style>