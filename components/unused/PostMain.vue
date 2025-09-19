<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Seller Banner -->
    <div v-if="seller?.store_banner" class="w-full h-40 sm:h-48 rounded-xl overflow-hidden mb-6 shadow-md">
      <img :src="seller.store_banner" alt="Seller Banner" class="w-full h-full object-cover" loading="lazy" @error="handleImageError" />
    </div>

    <h1 class="text-xl sm:text-2xl font-semibold text-gray-800">
      {{ seller?.store_name || seller?.store_description || 'Seller Profile' }}
    </h1>

    <div v-if="loading" class="flex justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C42B78]"></div>
    </div>

    <div v-else-if="error" class="bg-[#f8f0f0] text-brand-dark p-4 rounded-lg">{{ error }}</div>

    <div v-else>
      <nav
        class="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto"
        role="tablist"
        ref="tabList"
      >
        <button
          v-for="section in sections"
          :key="section.id"
          @click="setActiveSection(section.id)"
          @keydown="handleKeyDown($event, section.id)"
          class="px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-t-md transition-all duration-250"
          :class="{
            'bg-brand text-white': activeSection === section.id,
            'text-gray-600 hover:bg-brand/10 hover:text-brand-dark': activeSection !== section.id
          }"
          :aria-selected="activeSection === section.id"
          :aria-label="`View ${section.label} section`"
          role="tab"
          :tabindex="activeSection === section.id ? 0 : -1"
          ref="tabs"
        >
          {{ section.label }}
        </button>
      </nav>

      <!-- About Section -->
      <div v-if="activeSection === 'about'" class="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <img
            :src="seller?.store_logo || 'https://picsum.photos/id/1005/200'"
            :alt="seller?.store_name || 'Seller Avatar'"
            class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gray-200 object-cover"
            loading="lazy"
            @error="handleImageError"
          />
          <div class="text-center sm:text-left">
            <h2 class="text-lg sm:text-xl font-bold text-gray-800">
              {{ seller?.store_name || 'Anonymous Seller' }}
            </h2>
            <p v-if="seller?.is_verified" class="text-brand-dark font-medium">Verified Seller</p>
            <p class="text-gray-600 text-sm sm:text-base">{{ seller?.store_phone }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-gray-800">About</h3>
            <p class="text-gray-600 text-sm sm:text-base">{{ seller?.store_description || 'No description available.' }}</p>
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-gray-800">Details</h3>
            <p class="text-sm sm:text-base"><strong>Location:</strong> {{ seller?.store_location || 'Not specified' }}</p>
            <p class="text-sm sm:text-base"><strong>Contact:</strong> {{ seller?.store_phone }}</p>
            <p v-if="seller?.store_website" class="text-sm sm:text-base">
              <strong>Website:</strong>
              <a :href="seller?.store_website" class="text-brand-dark hover:underline" target="_blank">{{ seller?.store_website }}</a>
            </p>
          </div>

          <div v-if="seller?.store_socials" class="flex space-x-4">
            <a v-for="(link, key) in seller.store_socials" :key="key" :href="link" target="_blank" class="text-brand-dark hover:text-[#d81b46] transition-all duration-250">
              <Icon :name="`mdi:${key}`" size="20" />
            </a>
          </div>

          <div v-if="seller?.ratings">
            <h3 class="text-base sm:text-lg font-semibold text-gray-800">Ratings</h3>
            <p class="text-brand-dark text-base sm:text-lg">
              {{ seller?.ratings.average.toFixed(1) }} ★ ({{ seller?.ratings.count }} reviews)
            </p>
          </div>
        </div>
      </div>

      <!-- Products Section -->
      <div v-if="activeSection === 'products'" class="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 class="text-base sm:text-xl font-semibold text-gray-800 mb-4">Products</h2>
        <div v-if="seller?.products?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            v-for="product in seller?.products"
            :key="product.id"
            class="border rounded-lg shadow-sm p-4 hover:shadow-md transition-all duration-250"
          >
            <img
              :src="product.media?.[0]?.url || 'https://via.placeholder.com/300'"
              :alt="product.title"
              class="w-full h-40 sm:h-48 object-cover rounded-md mb-4"
              loading="lazy"
              @error="handleImageError"
            />
            <h3 class="text-base sm:text-lg font-medium text-gray-800">{{ product.title }}</h3>
            <p class="text-gray-600 text-sm sm:text-base line-clamp-2">{{ product.description }}</p>
            <p class="text-brand-dark font-semibold mt-2 text-sm sm:text-base">${{ product.price.toFixed(2) }}</p>
            <NuxtLink
              :to="`/product/${product.slug}`"
              class="mt-4 inline-block px-3 py-2 sm:px-4 sm:py-2 bg-brand text-white rounded-md hover:bg-[#d81b46] transition-all duration-250 text-sm sm:text-base"
            >
              View Product
            </NuxtLink>
          </div>
        </div>
        <p v-else class="text-gray-500 text-center text-sm sm:text-base">No products available.</p>
      </div>

      <!-- Reviews Section -->
      <div v-if="activeSection === 'reviews'" class="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 class="text-base sm:text-xl font-semibold text-gray-800 mb-4">Reviews</h2>
        <div v-if="seller?.reviews?.length" class="space-y-4">
          <div
            v-for="review in seller?.reviews"
            :key="review.user_id + review.created_at"
            class="border-b pb-4"
          >
            <div class="flex items-center space-x-2">
              <p class="text-brand-dark text-sm sm:text-base">
                {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
              </p>
              <p class="text-gray-500 text-xs sm:text-sm">{{ new Date(review.created_at).toLocaleDateString() }}</p>
            </div>
            <p class="text-gray-600 mt-2 text-sm sm:text-base">{{ review.comment || 'No comment provided.' }}</p>
          </div>
        </div>
        <p v-else class="text-gray-500 text-center text-sm sm:text-base">No reviews yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '~/stores/user.store';
import { type SellerProfileInterface, defaultSellerProfile } from '~/models/interface/auth/user.interface';
import type { LayoutKey } from '#build/types/layouts';

definePageMeta({
  layout: 'main' as LayoutKey,
});

const route = useRoute();
const sellerId = route.params.id as string;
const seller = ref<SellerProfileInterface>(defaultSellerProfile);
const loading = ref(true);
const error = ref<string | null>(null);
const activeSection = ref('about');
const userStore = useUserStore();

const sections = [
  { id: 'about', label: 'About' },
  { id: 'products', label: 'Products' },
  { id: 'reviews', label: 'Reviews' },
];

const tabs = ref<HTMLElement[]>([]);
const tabList = ref<HTMLElement | null>(null);

const fetchSellerProfile = async () => {
  loading.value = true;
  error.value = null;
  const success = await userStore.fetchPublicSellerProfile(sellerId);
  if (success) {
    seller.value = userStore.seller as SellerProfileInterface;
  } else {
    error.value = userStore.error || 'Failed to load seller profile';
  }
  loading.value = false;
};

const handleImageError = (e: Event) => {
  (e.target as HTMLImageElement).src = 'https://picsum.photos/id/1005/200';
};

const setActiveSection = async (id: string) => {
  activeSection.value = id;
  await nextTick(() => {
    const index = sections.findIndex((s) => s.id === id);
    const el = tabs.value[index];
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  });
};

const handleKeyDown = (event: KeyboardEvent, currentId: string) => {
  const index = sections.findIndex((s) => s.id === currentId);
  if (event.key === 'ArrowRight') {
    const nextIndex = (index + 1) % sections.length;
    setActiveSection(sections[nextIndex].id);
  } else if (event.key === 'ArrowLeft') {
    const prevIndex = (index - 1 + sections.length) % sections.length;
    setActiveSection(sections[prevIndex].id);
  }
};

onMounted(() => {
  fetchSellerProfile();
  tabs.value = Array.from(tabList.value?.children || []) as HTMLElement[];
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>