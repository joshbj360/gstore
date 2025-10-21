<template>
  <div class="min-h-screen bg-white">
    <!-- Top Nav: IG-Minimal (Logo + Icons) -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
      <div class="flex items-center justify-between max-w-5xl mx-auto">
        <NuxtLink to="/" class="flex items-center space-x-1">
          <Icon name="mdi:store-fashion" size="24" class="text-brand" />
          <span class="font-bold text-gray-900 hidden sm:inline">GStore</span>
        </NuxtLink>
        <div class="flex items-center space-x-4">
          <button class="p-2 rounded-full hover:bg-gray-100 transition-colors" @click="showAI = true">
            <Icon name="mdi:magnify" size="24" class="text-gray-600" />
          </button>
          <button class="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Icon name="mdi:heart-outline" size="24" class="text-gray-600" />
          </button>
          <NuxtLink to="/cart" class="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Icon name="mdi:cart-outline" size="24" class="text-gray-600" />
            <span v-if="cartStore.cartItems.length > 0" class="absolute -top-1 -right-1 bg-brand text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {{ cartStore.cartItems.length }}
            </span>
          </NuxtLink>
          <ClientOnly>
            <button v-if="userStore.isLoggedIn" @click="showMenu = !showMenu" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <img :src="userStore.userProfile?.avatar || '/default-avatar.png'" alt="Profile" class="w-8 h-8 rounded-full" />
            </button>
            <NuxtLink v-else to="/auth/login" class="px-4 py-2 bg-brand text-white rounded-full font-medium hover:bg-brand-dark transition-colors">
              Sign In
            </NuxtLink>
          </ClientOnly>
        </div>
      </div>
      <!-- Profile Menu -->
      <transition enter-active-class="transition-all duration-200" leave-active-class="transition-all duration-150">
        <div v-if="showMenu" class="absolute top-full right-4 mt-1 w-48 bg-white rounded-lg shadow-lg border z-50 py-1">
          <NuxtLink to="/profile" @click="showMenu = false" class="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors">Profile</NuxtLink>
          <NuxtLink v-if="userStore.isSeller" to="/seller/dashboard" @click="showMenu = false" class="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors">Dashboard</NuxtLink>
          <button @click="logout" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-t">Log Out</button>
        </div>
      </transition>
    </header>

    <!-- Main Feed: IG-Style Grid -->
    <main class="pt-16 pb-20 max-w-5xl mx-auto px-4">
      <!-- Stories Row: Horizontal Scroll -->
      <section class="mb-6 sticky top-16 bg-white z-10 py-2 border-b border-gray-200">
        <h2 class="sr-only">Stories</h2>
        <div class="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          <div v-for="story in stories" :key="story.id" class="flex-shrink-0">
            <button @click="openStory(story)" class="relative">
              <img :src="getMediaThumbnailUrl(story.media)" alt="Story" class="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200 hover:ring-brand transition-all duration-200" />
              <div v-if="story.isNew" class="absolute -top-1 -right-1 bg-brand text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">New</div>
            </button>
            <p class="text-xs text-center text-gray-600 mt-1 truncate w-16 block">{{ story.seller.store_name }}</p>
          </div>
          <!-- Add Story for Sellers -->
          <div v-if="userStore.isSeller" class="flex flex-col items-center min-w-[64px]">
            <button @click="showUploadModal = true" class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
              <Icon name="mdi:plus" class="w-6 h-6 text-gray-500" />
            </button>
            <p class="text-xs text-gray-600 mt-1">Your Story</p>
          </div>
        </div>
      </section>

      <!-- Product Grid: Masonry-Style for IG Feed -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <ProductCard
          v-for="product in featuredProducts"
          :key="product.id"
          :product="product"
          class="hover:scale-105 transition-transform duration-200"
          @add-to-cart="addToCart(product)"
        />
      </div>

      <!-- Load More -->
      <div v-if="!pending && hasMore" class="text-center mt-8">
        <button @click="loadMore" :disabled="isLoadingMore" class="px-8 py-3 bg-brand text-white rounded-full font-medium disabled:opacity-50 transition-colors">
          <span v-if="isLoadingMore">
            <Icon name="mdi:loading" class="mr-2" spin />
            Loading...
          </span>
          <span v-else>Load More</span>
        </button>
      </div>
    </main>

    <!-- Bottom Nav: Mobile Only -->
    <nav v-if="isMobile" class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      <div class="flex justify-around py-2">
        <NuxtLink to="/" class="flex flex-col items-center text-xs">
          <Icon name="mdi:home" size="20" class="text-gray-600 mb-1" />
          Home
        </NuxtLink>
        <NuxtLink to="/discover" class="flex flex-col items-center text-xs">
          <Icon name="mdi:view-grid" size="20" class="text-brand mb-1" />
          Discover
        </NuxtLink>
        <NuxtLink to="/reels" class="flex flex-col items-center text-xs">
          <Icon name="mdi:play-circle" size="20" class="text-gray-600 mb-1" />
          Reels
        </NuxtLink>
        <NuxtLink v-if="userStore.isLoggedIn" to="/profile" class="flex flex-col items-center text-xs">
          <Icon name="mdi:account" size="20" class="text-gray-600 mb-1" />
          Profile
        </NuxtLink>
        <NuxtLink v-else to="/auth/login" class="flex flex-col items-center text-xs">
          <Icon name="mdi:login" size="20" class="text-gray-600 mb-1" />
          Login
        </NuxtLink>
      </div>
    </nav>

    <!-- Modals -->
    <StoryModal :is-open="showUploadModal" @close="showUploadModal = false" @posted="refresh" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMediaQuery } from '@vueuse/core';
import { formatPrice } from '~/utils/formatters';
import { useApiService } from '~/services/api/apiService';
import { useCategoryStore, useUserStore, useCartStore, useProductStore } from '~/stores';
import { useAsyncData } from '#imports';
import { notify } from '@kyvg/vue3-notification';

import AIChat from '~/components/chat/AIChat.vue';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import HomeLayout from '~/layouts/HomeLayout.vue';
import HomePageSkeleton from '~/components/skeletons/HomePageSkeleton.vue';
import SideNav from '~/layouts/children/SideNav.vue';
import StoryModal from '~/components/stories/StoryModal.vue';
import { getMediaThumbnailUrl } from '~/utils/formatters';

const router = useRouter();
const apiService = useApiService();
const categoryStore = useCategoryStore();
const userStore = useUserStore();
const cartStore = useCartStore();
const productStore = useProductStore();

const showUploadModal = ref(false);
const showAI = ref(false);
const isLoadingMore = ref(false);
const isMobile = useMediaQuery('(max-width: 768px)');

const { data: pageData, pending, error, refresh } = await useAsyncData('homepage', async () => {
  await productStore.ensureInitialProductsLoaded();
  await categoryStore.fetchCategories();
  const homeData = await apiService.getHomepageData();
  return { ...homeData, categories: categoryStore.categories };
}, {
  default: () => ({
    stories: [],
    featuredProducts: [],
    topSellers: [],
    hotAccessories: [],
  }),
});

const stories = computed(() => pageData.value?.stories || []);
const featuredProducts = computed(() => pageData.value?.featuredProducts || []);
const topSellers = computed(() => pageData.value?.topSellers || []);
const categories = computed(() => pageData.value?.categories || []);
const hotAccessories = computed(() => pageData.value?.hotAccessories || []);

const dummyAds = [
  { id: 1, image: 'https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?w=800', title: 'Summer Vibes Collection', subtitle: '20% off dresses & tops' },
  { id: 2, image: 'https://images.unsplash.com/photo-1520975918318-3a6c29a6b3d3?w=800', title: 'Luxury Bags Drop', subtitle: 'Shop new arrivals' },
  { id: 3, image: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800', title: 'Mens Streetwear', subtitle: 'Fresh looks from ThreadHub' },
];

const openStory = (story: any) => {
  router.push(`/stories/${story.id}`);
};

const openProduct = (product: any) => {
  router.push(`/product/${product.slug}`);
};

const addToCart = (product: any) => {
  cartStore.addToCart({ product, variant: product.variants?.[0], quantity: 1 });
  notify({ type: 'success', text: `${product.title} added to bag!` });
};

const loadMore = async () => {
  isLoadingMore.value = true;
  try {
    await productStore.fetchMoreProducts();
    pageData.value.featuredProducts = [...pageData.value.featuredProducts, ...productStore.products.slice(pageData.value.featuredProducts.length)];
  } catch (err) {
    notify({ type: 'error', text: 'Load more failed—check connection.' });
  } finally {
    isLoadingMore.value = false;
  }
};

const hasMore = computed(() => productStore.hasMoreProducts);

const logout = async () => {
  await userStore.logout();
  router.push('/auth/login');
};

const showMenu = ref(false);
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>