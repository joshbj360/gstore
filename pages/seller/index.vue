<template>
  <HomeLayout>
    <!-- Page Content -->
    <div class="space-y-8">
        <!-- Page Header -->
        <section class="text-center py-8 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-neutral-100 mb-2">Discover Sellers</h1>
            <p class="text-gray-600 dark:text-neutral-400 max-w-xl mx-auto">
                Follow your favorite creators and get inspired by their style.
            </p>
        </section>

        <!-- Seller Grid -->
        <section class="px-4">
            <div v-if="pending && !sellers.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Skeleton Loader -->
                <div v-for="n in 6" :key="n" class="h-64 bg-gray-100 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
            </div>
             <div v-else-if="error" class="text-center py-20 text-red-500 dark:text-red-400">
                Failed to load sellers. Please try again.
            </div>
            <div v-else-if="sellers.length === 0" class="text-center py-16">
                 <Icon name="mdi:store-search-outline" size="64" class="mx-auto text-gray-300 dark:text-neutral-700 mb-4" />
                <h2 class="text-xl font-semibold text-gray-800 dark:text-neutral-300 mb-2">No Sellers Found</h2>
                <p class="text-gray-500 dark:text-neutral-500">Check back later for new sellers.</p>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                <SellerCard v-for="seller in sellers" :key="seller.id" :seller="seller" />
            </div>
        </section>

        <!-- Infinite Scroll Trigger -->
        <div ref="loadMoreTrigger" class="h-10"></div>
        <div v-if="isLoadingMore" class="flex justify-center py-8">
            <Icon name="eos-icons:loading" size="32" class="text-[#f02c56]" />
        </div>
    </div>
    
    <!-- Sidebar Content (fetched from the layout) -->
    <template #left-sidebar>
        <!-- The layout handles this -->
    </template>
    
    <!-- 
      THE FIX: The right sidebar now shows the sellers you follow,
      which is much more contextual and social.
    -->
    <template #right-sidebar>
         <div v-if="userStore.isLoggedIn && followedSellersList.length > 0">
            <h3 class="font-bold text-gray-800 dark:text-neutral-200 mb-2">Following</h3>
            <div class="space-y-1">
                <div 
                    v-for="seller in followedSellersList" 
                    :key="seller.store_slug"
                    class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                    <NuxtLink :to="`/seller/profile/${seller.store_slug}`" class="flex items-center space-x-3 min-w-0">
                        <img :src="seller.store_logo || '/default-store-logo.png'" alt="Seller"
                            class="w-8 h-8 rounded-full object-cover" />
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">{{
                                seller.store_name }}</p>
                        </div>
                    </NuxtLink>
                    
                    <!-- Quick Unfollow Button -->
                    <button 
                        @click.stop.prevent="followStore.toggleFollow(seller.id)"
                        class="text-sm font-semibold hover:underline ml-2 shrink-0 text-gray-500 dark:text-neutral-400"
                    >
                        Following
                    </button>
                </div>
            </div>
        </div>
         <div v-else>
             <h3 class="font-bold text-gray-800 dark:text-neutral-200 mb-2">Categories</h3>
             <ul class="space-y-1">
                <li v-for="cat in categories" :key="cat.id" @click="router.push(`/category/${cat.slug}`)"
                    class="text-sm text-gray-700 dark:text-neutral-300 cursor-pointer hover:text-[#f02c56]
                           dark:hover:text-[#f02c56] hover:bg-gray-100 dark:hover:bg-neutral-800 px-2 py-1.5 rounded-md flex items-center">
                    <img :src="cat.thumbnailCatUrl || 'https://placehold.co/20x20/e2e8f0/9ca3af?text=C'" alt="Category Icon"
                        class="inline-block w-6 h-6 mr-2 object-cover rounded-md" />
                    <span>{{ cat.name }}</span>
                </li>
            </ul>
         </div>
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {useUserStore, useFollowStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useRouter } from 'vue-router';
import HomeLayout from '~/layouts/HomeLayout.vue';
import SellerCard from '~/components/seller/SellerCard.vue';
import type { ISellerProfile } from '~/models';

const router = useRouter();
const apiService = useApiService();
const userStore = useUserStore();
const followStore = useFollowStore();

const sellers = ref<ISellerProfile[]>([]);
const nextCursor = ref<{ id: string, followers: number } | null>(null);
const hasMore = ref(true);
const isLoadingMore = ref(false);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// 1. Fetch layout data (for categories & top sellers in the sidebar)
const { data: layoutData } = useLayoutData();
const categories = computed(() => layoutData.value?.categories || []);
const topSellers = computed(() => layoutData.value?.topSellers || []);

// 2. Fetch initial page of all sellers
const { pending, error } = await useLazyAsyncData(
    'all-sellers',
    async () => {
        const { sellers: fetchedSellers, meta } = await apiService.getAllSellers({ limit: 12 });
        sellers.value = fetchedSellers;
        hasMore.value = meta.hasMorePages;
        nextCursor.value = meta.nextCursor;
        return { sellers, meta };
    }
);

// 3. Logic for Infinite Scroll (now uses cursor)
const loadMore = async () => { /* ... */ };

onMounted(() => {
    observer.value = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '200px' });
    if(loadMoreTrigger.value) observer.value.observe(loadMoreTrigger.value);
});

onUnmounted(() => {
    if(observer.value) observer.value.disconnect();
});

// 4. THE FIX: Create a computed list of the sellers you follow
const followedSellersList = computed(() => {
    // We filter the "Top Sellers" list from the layout data
    // to find the ones the user is following.
    return topSellers.value.filter(seller => 
        followStore.followedSellerIds.has(seller.id)
    );
});
</script>