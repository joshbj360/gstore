<template>
  <div class="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3" role="navigation" aria-label="Quick navigation">
    <div class="flex items-center justify-between max-w-7xl mx-auto">
      <!-- Categories -->
      <div class="flex items-center gap-2 sm:gap-3">
        <NuxtLink
          v-for="category in displayedCategories"
          :key="category.id"
          :to=" '/'"
          class="text-sm sm:text-base text-gray-600 hover:text-brand-dark hover:bg-brand/10 px-2 py-1 rounded-lg font-medium transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
          :aria-label="`Go to ${category.name} category`"
        >
          {{ category.name }}
        </NuxtLink>
        <span v-if="!categoryStore.categories.length" class="text-sm text-gray-500">No categories available</span>
      </div>

      <!-- Action Icons -->
      <div class="flex items-center gap-2 mt-2 sm:gap-3">
        <div v-if="!userStore.isLoggedIn">
          <NuxtLink to="/shoppingcart" class="relative p-1.5 hover:bg-brand/10 rounded-lg transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50" aria-label="View shopping cart">
            <Icon name="mdi:cart" size="23" class="text-gray-600 hover:text-brand-dark" />
            <span
              v-if="cartStore.cartCount"
              class="absolute -top-1 -right-1 bg-brand text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium"
            >
              {{ cartStore.cartCount }}
            </span>
          </NuxtLink>
        </div>
        
        <div v-else>
          <NuxtLink to="/messages" class="relative p-1.5 hover:bg-brand/10 rounded-lg transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50" aria-label="View messages">
          <Icon name="mdi:email-outline" size="20" class="text-gray-600 hover:text-brand-dark" />
          <span
            v-if="messageCount"
            class="absolute -top-1 -right-1 bg-brand text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium"
          >
            {{ messageCount }}
          </span>
        </NuxtLink>
        <NuxtLink to="/profile" class="relative p-1.5 hover:bg-brand/10 rounded-lg transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50" aria-label="View profile">
          <Icon name="mdi:account-outline" size="20" class="text-gray-600 hover:text-brand-dark" />
          <span
            v-if="notificationCount"
            class="absolute -top-1 -right-1 bg-brand text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium"
          >
            {{ notificationCount }}
          </span>
        </NuxtLink>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCartStore } from '~/stores/cart.store';
import { useCategoryStore, useUserStore} from '#build/imports';

const cartStore = useCartStore();
const categoryStore = useCategoryStore();
const userStore = useUserStore()
const messageCount = ref(3); // Replace with store or Supabase
const notificationCount = ref(7); // Replace with store or Supabase


const displayedCategories = computed(() => {
  // I assume that categoryStore.categories has been populated with categories
  if (!categoryStore.categories || categoryStore.categories.length === 0) {
    return [];
  }
  return categoryStore.categories.slice(0, 4);
});
</script>