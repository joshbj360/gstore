<template>
    <div class="relative w-full max-w-md mx-auto">
        <!-- Core Search Input -->
        <div class="flex items-center bg-gray-100 p-1.5 rounded-full border-2 border-transparent focus-within:border-[#f02c56] transition-all duration-200">
            <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                class="w-full bg-transparent px-4 py-1.5 text-sm placeholder-gray-500 focus:outline-none"
                placeholder="Search products, styles..."
                @input="debouncedSearch"
                @keydown.enter="executeSearch"
                @focus="isSearchActive = true"
            />
            <button type="button" class="px-3 flex-shrink-0" @click="executeSearch" aria-label="Search">
                <Icon name="mdi:magnify" size="20" class="text-gray-500 hover:text-gray-700 transition-colors" />
            </button>
        </div>

       <ClientOnly>
  <transition 
    enter-active-class="transition-all duration-200 ease-out"
    leave-active-class="transition-all duration-150 ease-in"
    enter-from-class="opacity-0 -translate-y-1"
    leave-to-class="opacity-0 translate-y-1"
  >
    <!-- FIX: moved v-click-outside to the actual dropdown container -->
    <div
      v-if="isSearchActive && searchQuery"
      v-click-outside="deactivateSearch"
      class="absolute inset-x-0 top-full mt-1 bg-white shadow-lg rounded-lg z-50 border max-h-80 overflow-y-auto w-full"
    >
      <div v-if="isSearching" class="p-3 text-center text-gray-500 text-sm">
        <Icon name="eos-icons:loading" class="inline-block mr-2 animate-spin" /> Searching...
      </div>

      <div v-else-if="searchResults.length === 0 && searchQuery.length > 1" class="p-4 text-center text-gray-500 text-sm">
        No results found for "{{ searchQuery }}"
      </div>

      <div v-else class="divide-y divide-gray-100">
        <NuxtLink
          v-for="item in searchResults"
          :key="item.id"
          :to="`/product/${item.slug}`"
          @click="deactivateSearch"
          class="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center space-x-3 min-w-0">
            <img
              class="rounded-lg w-10 h-10 object-cover flex-shrink-0"
              :src="item.media?.[0]?.url || 'https://via.placeholder.com/40'"
              alt="Product"
            />
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
            </div>
          </div>
          <div class="text-sm font-bold text-brand">{{ formatPrice(item.price) }}</div>
        </NuxtLink>
      </div>

      <button
        @click="openAIChat"
        class="w-full p-3 text-left border-t text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Icon name="mdi:robot-happy-outline" class="w-4 h-4 inline mr-2" />
        Get AI Style Tips for "{{ searchQuery }}"
      </button>
    </div>
  </transition>
</ClientOnly>

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import type { IProduct } from '~/models';
import { useApiService } from '~/services/api/apiService';
import { formatPrice } from '~/utils/formatters';

const emit = defineEmits<{
  (e: 'open-ai-chat', value: string): void;
}>();

const apiService = useApiService();

const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref<IProduct[]>([]);
// THE FIX: A new state variable to control the dropdown's visibility.
const isSearchActive = ref(false);

const executeSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  };
  isSearching.value = true;
  try {
    searchResults.value = await apiService.searchProducts(searchQuery.value);
  } finally {
    isSearching.value = false;
  }
};

const debouncedSearch = useDebounceFn(executeSearch, 300);

// THE FIX: This method is now called by the `v-click-outside` directive.
const deactivateSearch = () => {
  isSearchActive.value = false;
};

const openAIChat = () => {
  emit('open-ai-chat', searchQuery.value);
  deactivateSearch(); // Close the search results when opening the AI chat
};
</script>

