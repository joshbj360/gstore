<template>
  <HomeLayout>
    <!-- Main Page Content -->
    <div>
      <SellerProfileSkeleton v-if="pending" />

      <div v-else-if="error || !sellerData" class="text-center py-20">
        <h2 class="text-2xl font-bold text-red-500">Store Not Found</h2>
        <p class="text-gray-600 dark:text-neutral-400 mt-2">The store you are looking for does not exist or may have been moved.</p>
        <NuxtLink to="/" class="mt-4 inline-block bg-[#f02c56] text-white px-6 py-2 rounded-md hover:bg-[#d81b36]">
            Browse All Products
        </NuxtLink>
      </div>

      <div v-else class="text-gray-900 dark:text-neutral-100">
        <!-- Cover Image -->
        <div class="relative h-48 bg-gray-200 dark:bg-neutral-800">
          <img :src="sellerData.store_banner || 'https://placehold.co/1500x500/e2e8f0/9ca3af?text=Banner'" :alt="`${sellerData.store_name} cover`" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-gray-50/50 dark:from-neutral-950/50 to-transparent" />
        </div>

        <!-- Main Profile Section -->
        <div class="px-4 max-w-6xl mx-auto">
          <!-- Profile Header -->
          <div class="flex items-end gap-4 -mt-12 relative z-10">
            <img :src="sellerData.store_logo || '/default-store-logo.png'" :alt="sellerData.store_name || 'Store Logo'" class="w-24 h-24 rounded-full border-4 border-white dark:border-neutral-900 shadow-lg object-cover" />
            <div class="flex-1 pb-2">
              <div class="flex items-center gap-2 mb-1">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">{{ sellerData?.store_name }}</h2>
                <Icon v-if="sellerData?.is_verified" name="mdi:check-decagram" size="20" class="text-blue-500" title="Verified Seller" />
              </div>
              <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-neutral-400">
                <div class="flex items-center gap-1"><Icon name="mdi:map-marker-outline" size="16" />{{ sellerData?.store_location || 'No location' }}</div>
              </div>
            </div>
          </div>

          <!-- Stats Bar -->
          <div class="flex justify-around py-4 border-y border-gray-200 dark:border-neutral-800 my-4">
            <div class="text-center"><div class="font-bold text-lg">{{ sellerProducts.length }}</div><div class="text-sm text-gray-500 dark:text-neutral-400">Products</div></div>
            <div class="text-center"><div class="font-bold text-lg">{{ formatNumber(sellerData.followers_count || 0) }}</div><div class="text-sm text-gray-500 dark:text-neutral-400">Followers</div></div>
            <div class="text-center"><div class="font-bold text-lg">4.8 <span class="text-gray-400 dark:text-neutral-500 font-normal">(1.2k)</span></div><div class="text-sm text-gray-500 dark:text-neutral-400">Rating</div></div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 py-4">
            <button @click="toggleFollow" class="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors" :class="isFollowing ? 'bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-neutral-100' : 'bg-[#f02c56] text-white'">
              {{ isFollowing ? 'Following' : 'Follow' }}
            </button>
            <button @click="openChat" class="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700">Message</button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-gray-200 dark:border-neutral-800">
            <button @click="activeTab = 'products'" class="tab-button" :class="{ 'active': activeTab === 'products' }">Products</button>
            <button @click="activeTab = 'about'" class="tab-button" :class="{ 'active': activeTab === 'about' }">About</button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="p-4 max-w-6xl mx-auto">
          <div v-if="activeTab === 'products'">
            <div v-if="sellerProducts.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <ProductCard v-for="product in sellerProducts" :key="product.id" :product="product" />
            </div>
            <div v-else class="text-center py-12 text-gray-500 dark:text-neutral-500">This store has no products yet.</div>
          </div>
          <div v-else-if="activeTab === 'about'" class="prose dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300">
            <h3>About {{ sellerData.store_name }}</h3>
            <p>{{ sellerData.store_description || 'No description provided.' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar Content (fetched from the layout) -->
    <template #left-sidebar>
        <SideNav :top-sellers="topSellers" :categories="categories" />
    </template>
    <template #right-sidebar>
        <!-- The right sidebar can be empty or have other content on this page -->
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore, useProductStore, useFollowStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useLayoutData } from '~/composables/useLayoutData';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import SellerProfileSkeleton from '~/components/skeletons/SellerProfileSkeleton.vue';
import HomeLayout from '~/layouts/HomeLayout.vue';
import SideNav from '~/layouts/children/SideNav.vue';
import type { IProduct } from '~/models';
import { formatNumber } from '~/utils/formatters';

const route = useRoute();
const userStore = useUserStore();
const productStore = useProductStore();
const followStore = useFollowStore(); // THE FIX: Initialize the store
const apiService = useApiService();
const slug = route.params.store_slug as string;

const activeTab = ref('products');

// 1. Fetch layout data (categories, top sellers) from our composable
const { data: layoutData } = useLayoutData();
const categories = computed(() => layoutData.value?.categories || []);
const topSellers = computed(() => layoutData.value?.topSellers || []);

// 2. Fetch all page-specific data in a single, unified call
const { data, pending, error } = await useLazyAsyncData(
  `seller-profile-${slug}`,
  async () => {
    // Fetch seller profile and their products in parallel
    const [sellerData, productData] = await Promise.all([
      apiService.getSellerProfileBySlug(slug),
      productStore.getProductsByStoreSlug(slug)
    ]);
    return { sellerData, productData };
  }
);

// 3. Create clean computed properties from the fetched data
const sellerData = computed(() => data.value?.sellerData);
const sellerProducts = computed(() => data.value?.productData || []);

// THE FIX: "Follow" logic is now reactive and functional
const isFollowing = computed(() => {
    return !!sellerData.value && followStore.followedSellerIds.has(sellerData.value.id);
});
const toggleFollow = () => {
    if (sellerData.value) {
        followStore.toggleFollow(sellerData.value.id);
        // Optimistic update for follower count
        const change = isFollowing.value ? -1 : 1;
        sellerData.value.followers_count = (sellerData.value.followers_count || 0) + change;
    }
};

const openChat = () => { /* ... chat logic ... */ };
</script>

<style scoped>
.tab-button {
    @apply flex-1 py-3 text-center font-medium border-b-2 transition-colors text-gray-500 dark:text-neutral-500 border-transparent hover:text-gray-800 dark:hover:text-neutral-100;
}
.tab-button.active {
    @apply border-[#f02c56] text-[#f02c56];
}
</style>

