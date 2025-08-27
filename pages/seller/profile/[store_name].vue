<template>
  <div>
    <div v-if="loading">
      <SellerProfileSkeleton />
    </div>

    <div v-else-if="!sellerStore" class="text-center py-20">
        <h2 class="text-2xl font-bold">Store Not Found</h2>
        <p class="text-gray-500 mt-2">The store you are looking for does not exist.</p>
    </div>

    <div v-else class="p-6 md:p-8 max-w-6xl mx-auto">
     
      
      <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-start gap-4">
            <img 
              loading="lazy"
              :src="sellerStore.store_logo || '/default-store-logo.png'" 
              :alt="sellerStore.store_name || 'Store logo'"
              class="rounded-full w-16 h-16 md:w-20 md:h-20 object-cover border-2 border-gray-100"
            />
            
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-xl md:text-2xl font-bold text-gray-900">{{ sellerStore.store_name }}</h1>
                <Icon v-if="sellerStore.is_verified" name="mdi:check-decagram" size="20" class="text-[#C42B78]" />
              </div>

              <p 
                @click="showAboutTab"
                class="text-gray-600 mt-1 max-w-lg cursor-pointer hover:underline"
              >
                {{ truncatedDescription }}
              </p>
              
              <div class="flex items-center gap-4 mt-3 text-sm">
                <div class="flex items-center text-gray-500">
                  <Icon name="mdi:map-marker" size="16" class="mr-1" />
                  <span>{{ sellerStore.store_location || 'Not specified' }}</span>
                </div>
                <div class="flex items-center text-gray-500">
                  <Icon name="mdi:account-multiple" size="16" class="mr-1" />
                  <span>{{ formatNumber(sellerStore.followers_count || 0) }} followers</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex gap-3">
            <button @click="openChat" class="px-5 py-2.5 rounded-lg font-medium text-sm border border-[#C42B78] text-[#C42B78] hover:bg-[#C42B78]/10 transition-colors flex items-center">
              <Icon name="mdi:message-outline" size="18" class="mr-2" />
              Chat
            </button>
            <button v-if="userStore.isLoggedIn && userStore.user?.id !== sellerStore.profileId" @click="toggleFollow" class="px-5 py-2.5 rounded-lg font-medium text-sm border transition-colors w-28" :class="{ 'border-[#C42B78] text-[#C42B78] hover:bg-[#C42B78]/10': !isFollowing, 'bg-[#C42B78] text-white border-[#C42B78]': isFollowing }">
              {{ isFollowing ? 'Following' : 'Follow' }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="flex items-center border-b border-gray-200 mb-8">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" class="px-4 py-3 font-medium text-sm relative" :class="{'text-[#C42B78]': activeTab === tab.id, 'text-gray-600 hover:text-gray-900': activeTab !== tab.id}">
          {{ tab.label }}
          <span v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C42B78]"></span>
        </button>
      </div>
      
      <div v-show="activeTab === 'products'">
        <div v-if="products.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ProductCard v-for="product in products" :key="product.id" :product="product" class="w-full" />
        </div>
        <div v-else class="text-center py-12">
            <Icon name="mdi:package-variant-closed" size="48" class="mx-auto text-gray-300 mb-4" />
            <p class="text-gray-500">This store hasn't listed any products yet.</p>
        </div>
      </div>
      
      <div v-if="activeTab === 'about'" class="bg-white rounded-xl shadow-sm p-6">
        <div class="prose prose-sm text-gray-600 max-w-none">
          <p>{{ sellerStore.store_description }}</p>
          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
            <div>
                <h3 class="font-medium text-gray-800 mb-2 flex items-center gap-2"><Icon name="mdi:calendar-month" size="18" class="text-[#C42B78]" />Store Since</h3>
                <p>{{ formatDate(sellerStore.created_at) }}</p>
            </div>
            <div>
                <h3 class="font-medium text-gray-800 mb-2 flex items-center gap-2"><Icon name="mdi:map-marker-outline" size="18" class="text-[#C42B78]" />Location</h3>
                <p>{{ sellerStore.store_location || 'Not specified' }}</p>
            </div>
          </div>
        </div>
      </div>

       <div v-if="activeTab === 'reviews'" class="text-center py-12 bg-white rounded-xl shadow-sm">
          <Icon name="mdi:star-off-outline" size="48" class="mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">Reviews for this store are not available yet.</p>
      </div>
      
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { useUserStore } from '~/stores/user.store';
import { useProductStore } from '#imports';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import SellerProfileSkeleton from '~/components/shared/SellerProfileSkeleton.vue';

definePageMeta({
  layout: 'seller-profile-layout',
});

const route = useRoute();
const userStore = useUserStore();
const productStore = useProductStore();

const storeName = route.params.store_name as string;
const loading = ref(true);
const isFollowing = ref(false); // This would be fetched from a 'followers' table
const activeTab = ref('products');

// Use computed properties to reactively get data from the stores
const sellerStore = computed(() => userStore.sellerCache.get(storeName));
const products = computed(() => productStore.sellerProductCache.get(storeName) || []);

const truncatedDescription = computed(() => {
  const description = sellerStore.value?.store_description || 'No store description available';
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

// Data fetching is now done in parallel for performance
onMounted(async () => {
  loading.value = true;
  try {
    // Fire both requests at the same time
    await Promise.all([
      userStore.fetchSellerStoreByStoreName(storeName),
      productStore.getProductsByStoreName(storeName)
    ]);
  } catch (error) {
    console.error('Error loading store data:', error);
  } finally {
    loading.value = false;
  }
});

const toggleFollow = async () => {
  const originalFollowState = isFollowing.value;
  try {
    isFollowing.value = !isFollowing.value;
    // Call API to follow/unfollow
    // Example: await followApi.toggle(sellerStore.value.profile_id);
    if (sellerStore.value) {
        sellerStore.value.followers_count = (sellerStore.value.followers_count || 0) + (isFollowing.value ? 1 : -1);
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