<template>
    <ClientOnly>
        <div class="relative w-full">
            <div class="flex items-center bg-gray-100 dark:bg-neutral-800 p-1.5 rounded-full border-2 border-transparent focus-within:border-[#f02c56] transition-colors">
                <input
                    ref="searchInput"
                    v-model="searchQuery"
                    type="text"
                    class="w-full bg-transparent px-4 py-1 text-sm text-gray-900 dark:text-neutral-100 placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none"
                    placeholder="Search products..."
                    @focus="isSearchActive = true"
                    @input="debouncedSearch"
                />
                <button type="button" class="px-2" @click="executeSearch" aria-label="Search">
                    <Icon name="mdi:magnify" size="20" class="text-gray-500 dark:text-neutral-400" />
                </button>
            </div>

            <!-- Results Dropdown -->
            <transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="isSearchActive && searchQuery" class="absolute bg-white dark:bg-neutral-900 w-full mt-2 shadow-lg rounded-lg z-50 border border-gray-200 dark:border-neutral-700 max-h-96 overflow-y-auto">
                    <div v-if="isSearching" class="p-3 text-center text-gray-500 dark:text-neutral-400 text-sm">Searching...</div>
                    <div v-else-if="searchResults.length === 0 && searchQuery.length > 1" class="p-4 text-center text-gray-500 dark:text-neutral-400 text-sm">
                        No results found for "{{ searchQuery }}"
                    </div>
                    <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
                        <NuxtLink v-for="item in searchResults" :key="item.id" :to="`/product/${item.slug}`" @click="deactivateSearch" class="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                            <div class="flex items-center space-x-3 min-w-0">
                                <img class="rounded-lg w-10 h-10 object-cover flex-shrink-0" :src="item.media?.[0]?.url || 'https://via.placeholder.com/40'" alt="Product" />
                                <p class="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">{{ item.title }}</p>
                            </div>
                            <div class="text-sm font-bold text-[#f02c56]">{{ formatPrice(item.price) }}</div>
                        </NuxtLink>
                    </div>
                </div>
            </transition>
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useApiService } from '~/services/api/apiService';
import type { IProduct } from '~/models';
import { formatPrice } from '~/utils/formatters';

const apiService = useApiService();
const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref<IProduct[]>([]);
const isSearchActive = ref(true); // Default to active inside the overlay

const executeSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  isSearching.value = true;
  try {
    searchResults.value = await apiService.searchProducts(searchQuery.value);
  } finally {
    isSearching.value = false;
  }
};

const debouncedSearch = useDebounceFn(executeSearch, 300);

const deactivateSearch = () => {
  isSearchActive.value = false;
};
</script>

