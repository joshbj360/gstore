<template>
   <div>
    <!-- Header with Back Navigation -->
    <header class="sticky top-0 z-10 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center">
        <button 
          @click="navigateHome"
          class="flex items-center text-gray-700 hover:text-[#f02c56] transition-colors"
        >
          <Icon name="mdi:arrow-left" size="24" class="mr-2" />
          <span class="font-medium">Back to Home</span>
        </button>
      </div>
    </header>

  <div class="space-y-6 p-4 sm:p-6 container mx-auto">

    <!-- Store Banner -->
    <div v-if="seller?.store_banner" class="w-full h-40 sm:h-60 rounded-xl overflow-hidden mb-6 shadow-md relative">
      <img
        :src="seller.store_banner"
        alt="Store Banner"
        class="w-full h-full object-cover"
        loading="lazy"
        @error="handleImageError"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-6">
        <h1 class="text-2xl sm:text-3xl font-bold text-white">
          {{ seller?.store_name }}
        </h1>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="error" class="bg-[#f8f0f0] text-[#f02c56] p-4 rounded-lg">{{ error }}</div>

    <div v-else>
      <!-- Navigation Tabs -->
      <nav
        class="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto"
        role="tablist"
      >
        <button
          v-for="section in sections"
          :key="section.id"
          @click="activeSection = section.id"
          class="px-4 py-2 text-sm sm:text-base font-medium rounded-t-md transition-all duration-250"
          :class="{
            'bg-[#f02c56] text-white': activeSection === section.id,
            'text-gray-600 hover:bg-[#f02c56]/10 hover:text-[#f02c56]': activeSection !== section.id
          }"
        >
          {{ section.label }}
          <span 
            v-if="section.id === 'products' && seller?.products?.length" 
            class="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full"
          >
            {{ seller?.products.length }}
          </span>
        </button>
      </nav>

      <!-- About Section -->
      <div v-if="activeSection === 'about'" class="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
          <img
            :src="seller?.store_logo || 'https://picsum.photos/id/1005/200'"
            :alt="seller?.store_name"
            class="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gray-200 object-cover"
            loading="lazy"
            @error="handleImageError"
          />
          <div class="text-center sm:text-left">
            <div class="flex items-center justify-center sm:justify-start">
              <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
                {{ seller?.store_name }}
              </h2>
              <Icon 
                v-if="seller?.is_verified" 
                name="mdi:check-decagram" 
                size="20" 
                class="ml-2 text-[#f02c56]" 
              />
            </div>
            <p class="text-gray-600 mt-2">{{ seller?.store_description || 'No store description available.' }}</p>
            
            <div class="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
              <div v-if="seller?.store_location" class="flex items-center text-sm text-gray-600">
                <Icon name="mdi:map-marker" size="16" class="mr-1" />
                {{ seller?.store_location }}
              </div>
              <div v-if="seller?.store_phone" class="flex items-center text-sm text-gray-600">
                <Icon name="mdi:phone" size="16" class="mr-1" />
                {{ seller?.store_phone }}
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Contact Information -->
          <div>
            <h3 class="text-lg font-semibold text-gray-800 mb-3">Contact</h3>
            <div class="space-y-2">
              <p v-if="seller?.store_website" class="text-sm">
                <span class="font-medium text-gray-700">Website:</span>
                <a :href="seller?.store_website" target="_blank" class="text-[#f02c56] hover:underline ml-2">
                  {{ seller?.store_website }}
                </a>
              </p>
              <p v-if="seller?.store_phone" class="text-sm">
                <span class="font-medium text-gray-700">Email:</span>
                <a :href="`mailto:${seller?.store_phone}`" class="text-[#f02c56] hover:underline ml-2">
                  {{ seller?.store_phone }}
                </a>
              </p>
            </div>
          </div>

          <!-- Social Media -->
          <div v-if="seller?.store_socials">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">Follow Us</h3>
            <div class="flex space-x-4">
              <a 
                v-for="(url, platform) in seller?.store_socials" 
                :key="platform"
                :href="url" 
                target="_blank"
                class="text-gray-600 hover:text-[#f02c56] transition-colors"
              >
                <Icon :name="getSocialIcon(platform)" size="20" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Section -->
      <div v-if="activeSection === 'products'" class="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Products</h2>
        
        <div v-if="products?.length" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          <div
            v-for="product in products"
            :key="product.id"
            class="border rounded-lg shadow-sm p-4 hover:shadow-md transition-all duration-250"
          >
            <NuxtLink :to="`/product/${product.id}`" class="block">
              <img
                :src="product.media[0].url || 'https://picsum.photos/id/1005/32'"
                :alt="product.title"
                class="w-full h-40 sm:h-48 object-cover rounded-md mb-4"
                loading="lazy"
                @error="handleImageError"
              />
              <h3 class="text-base sm:text-lg font-medium text-gray-800">{{ product.title }}</h3>
              <p v-html="product.description" class="text-gray-600 text-sm sm:text-base line-clamp-2"></p>
              <p class="text-[#f02c56] font-semibold mt-2">${{ (product.price / 100).toFixed(2) }}</p>
            </NuxtLink>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <Icon name="mdi:package-variant-closed" size="48" class="mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">No products available yet</p>
        </div>
      </div>

      <!-- Reviews Section -->
      <div v-if="activeSection === 'reviews'" class="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Customer Reviews</h2>
          <div v-if="seller?.ratings" class="flex items-center">
            <div class="flex text-[#f02c56] mr-2">
              <Icon v-for="i in 5" :key="i" name="mdi:star" size="20" :class="{'opacity-30': i > seller?.ratings.count}" />
            </div>
            <span class="text-sm text-gray-600">
              {{ seller?.ratings.average.toFixed(1) }} ({{ seller?.reviews?.length || 0 }} reviews)
            </span>
          </div>
        </div>
        
        <div v-if="seller?.reviews?.length" class="space-y-4">
          <div
            v-for="review in seller?.reviews"
            :key="review.user_id"
            class="border-b pb-4 last:border-b-0"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <img 
                  :src="review.user_id || 'https://picsum.photos/id/1005/200'" 
                  class="w-10 h-10 rounded-full mr-3"
                  loading="lazy"
                  @error="handleImageError"
                />
                <div>
                  <p class="font-medium">{{ review.user_id }}</p>
                  <p class="text-gray-500 text-sm">{{ formatDate(review.created_at) }}</p>
                </div>
              </div>
              <div class="flex text-[#f02c56]">
                <Icon v-for="i in review.rating" :key="i" name="mdi:star" size="16" />
              </div>
            </div>
            <p class="mt-2 text-gray-700">{{ review.comment }}</p>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <Icon name="mdi:comment-text-outline" size="48" class="mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">No reviews yet</p>
        </div>
      </div>
    </div>
  </div>
   </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user.store'
import { useProductStore } from '#build/imports';
import { type SellerStoreInterface} from '@/models/interface/auth/user.interface'
import type { ProductInterface } from '~/models/interface/products/product.interface';
import LoadingSpinner from '@/components/shared/Loading.vue'


const router = useRouter();
const route = useRoute();
const userStore = useUserStore()
const productStore = useProductStore()
const store_name = route.params.id as string;
const products = ref<ProductInterface[]>([])

const seller = ref<SellerStoreInterface | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const activeSection = ref('about');

const sections = [
  { id: 'about', label: 'About' },
  { id: 'products', label: 'Products' },
  { id: 'reviews', label: 'Reviews' },
];

const fetchSellerProfile = async () => {
  loading.value = true
  error.value = null;
  const success = await userStore.fetchSellerStoreByStoreName(store_name);
  if (success) {
    seller.value = userStore.seller as SellerStoreInterface;
  } else {
    error.value = userStore.error || 'Failed to load seller profile';
  }
  loading.value  = false
};

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  if (target.classList.contains('store-logo')) {
    target.src = 'https://picsum.photos/id/1005/200';
  } else {
    target.src = 'https://via.placeholder.com/300';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getSocialIcon = (platform: string) => {
  const icons: Record<string, string> = {
    facebook: 'mdi:facebook',
    twitter: 'mdi:twitter',
    instagram: 'mdi:instagram',
    youtube: 'mdi:youtube',
    linkedin: 'mdi:linkedin',
    tiktok: 'mdi:tiktok',
    pinterest: 'mdi:pinterest'
  };
  return icons[platform.toLowerCase()] || 'mdi:link';
};
const loadSellerProducts = async () => {
  try {
    error.value = null;
    loading.value = true;

    if (!store_name) {
      error.value = 'No seller ID provided';
      return;
    }

    products.value = await productStore.getProductsByStoreName(store_name)
  } catch (err) {
    error.value = 'Failed to load products from this seller';
    console.error('Products by seller error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSellerProfile();
  loadSellerProducts()
});


const navigateHome = () => {
  router.push('/');
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.store-banner {
  height: 300px;
}

@media (max-width: 640px) {
  .store-banner {
    height: 200px;
  }
}
</style>