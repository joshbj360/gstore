<template>
  <div>
    <!-- The Skeleton Loader is shown while the initial data is pending -->
    <SellerProfileSkeleton v-if="pending" />

    <!-- The Error state is shown if the fetch fails -->
    <div v-else-if="error || !sellerData" class="text-center py-20">
        <h2 class="text-2xl font-bold">Store Not Found</h2>
        <p class="text-gray-500 mt-2">The store you are looking for does not exist or may have been moved.</p>
        <NuxtLink to="/" class="mt-4 inline-block bg-brand text-white px-6 py-2 rounded-md hover:bg-[#df4949]">
            Browse All Products
        </NuxtLink>
    </div>

    <!-- The real content is only rendered AFTER data has successfully arrived -->
    <div v-else class="min-h-screen bg-background">
      <!-- Cover Image -->
      <div class="relative h-48 bg-gray-200">
        <img :src="sellerData.store_banner || 'https://picsum.photos/id/1040/1500/500'" :alt="`${sellerData.store_name} cover`" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <!-- Main Profile Section -->
      <div class="px-4 max-w-6xl mx-auto">
        <!-- Profile Header -->
        <div class="flex items-end gap-4 -mt-12 relative z-10">
          <img :src="sellerData.store_logo || 'https://picsum.photos/id/1040/1500/500'" :alt="sellerData.store_name || 'Store Logo'" class="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
          <div class="flex-1 pb-2">
            <div class="flex items-center gap-2 mb-1">
              <h2 class="text-2xl font-bold text-gray-900">{{ sellerData?.store_name }}</h2>
              <Icon v-if="sellerData?.is_verified" name="mdi:check-decagram" size="20" class="text-brand" title="Verified Seller" />
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <div class="flex items-center gap-1"><Icon name="mdi:map-marker-outline" size="16" />{{ sellerData?.store_location || 'No location' }}</div>
            </div>
          </div>
        </div>

        <!-- Stats Bar -->
        <div class="flex justify-around py-4 border-y my-4">
            <div class="text-center"><div class="font-bold text-lg">{{ sellerData.products?.length }}</div><div class="text-sm text-gray-500">Products</div></div>
            <div class="text-center"><div class="font-bold text-lg">{{ formatNumber(sellerData.followers_count || 0) }}</div><div class="text-sm text-gray-500">Followers</div></div>
            <div class="text-center"><div class="font-bold text-lg">4.8 <span class="text-gray-400 font-normal">(1.2k)</span></div><div class="text-sm text-gray-500">Rating</div></div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 py-4">
          <button @click="toggleFollow" class="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors" :class="isFollowing ? 'bg-gray-200 text-gray-800' : 'bg-brand text-white'">
            {{ isFollowing ? 'Following' : 'Follow' }}
          </button>
          <button @click="openChat" class="flex-1 py-2.5 rounded-lg font-semibold text-sm border bg-white hover:bg-gray-50">Message</button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b">
          <button @click="activeTab = 'products'" class="tab-button" :class="{ 'active': activeTab === 'products' }">Products</button>
          <button @click="activeTab = 'about'" class="tab-button" :class="{ 'active': activeTab === 'about' }">About</button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="p-4 max-w-6xl mx-auto">
        <div v-if="activeTab === 'products'">
          <div v-if="sellerProducts" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ProductCard v-for="product in sellerProducts" :key="product.id" :product="product" />
          </div>
          <div v-else class="text-center py-12 text-gray-500">This store has no products yet.</div>
        </div>
        <div v-else-if="activeTab === 'about'" class="prose max-w-none">
          <h3>About {{ sellerData.store_name }}</h3>
          <p>{{ sellerData.store_description || 'No description provided.' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '~/stores/user.store';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import SellerProfileSkeleton from '~/components/shared/SellerProfileSkeleton.vue';
import { useApiService } from '~/services/api/apiService';
import type { IProduct } from '~/models';

definePageMeta({
  layout: 'profile-layout',
});

const route = useRoute();
const userStore = useUserStore();
const productStore = useProductStore();
const activeTab = ref('products');
const isFollowing = ref(false);

// This is the core of the optimization. It fetches all necessary data before the page renders.
const { data: sellerData, pending, error } = await useAsyncData(
  `seller-profile-${route.params.store_slug}`,
  () => {
      const apiService = useApiService();
      return apiService.getSellerProfileBySlug(route.params.store_slug as string)
  }
);

const sellerProducts = computed(() => {
  const products: IProduct[] = [];
  productStore.getProductsByStoreSlug(route.params.store_slug as string).then(
    (res) => {
      products.push(...(res || []));
    }
  )
  return products
});
const truncatedDescription = computed(() => {
  const description = sellerData.value?.store_description || 'No store description available';
  if (description.length > 100) {
    return `${description.substring(0, 100)}... read more`;
  }
  return description;
});

const tabs = [
  { id: 'products', label: 'Products' },
  { id: 'about', label: 'About' },
  { id: 'reviews', label: 'Reviews' }
];
const showAboutTab = () => {
  activeTab.value = 'about';
};

const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
};


const toggleFollow = async () => {
  const originalFollowState = isFollowing.value;
  try {
    isFollowing.value = !isFollowing.value;
    // Call API to follow/unfollow
    // Example: await followApi.toggle(sellerStore.value.profile_id);
    if (sellerData.value) {
        sellerData.value.followers_count = (sellerData.value.followers_count || 0) + (isFollowing.value ? 1 : -1);
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    isFollowing.value = originalFollowState; // Revert on error
  }
};

// Chat functionality can be expanded here
const showChat = ref(false);
const openChat = () => { if (userStore.isLoggedIn) showChat.value = true; /* else redirect to login */ };

</script>
<style scoped>
.tab-button {
    @apply flex-1 py-3 text-center font-medium border-b-2 transition-colors text-gray-500 border-transparent hover:text-gray-800;
}
.tab-button.active {
    @apply border-[#f02c56] text-brand;
}
</style>