<template>
  <div
    id="side-nav-main"
    class="fixed z-20 bg-white pt-[70px] h-full w-[75px] lg:w-64 overflow-auto lg:border-r border-r"
  >
    <!-- Error Message -->
    <div v-if="error" class="bg-red-100 text-red-700 p-4 rounded mb-4 text-center text-sm">
      {{ error }}
    </div>

    <div class="w-[55px] lg:w-full mx-auto">
      <NuxtLink to="/">
        <MenuItem iconString="Home" colorString="#f02c56" sizeString="28" />
      </NuxtLink>
      <MenuItem iconString="Trending" colorString="#161718" sizeString="26" />
      <MenuItem iconString="Grandeur Collections" colorString="#161718" sizeString="26" />
      <MenuItem iconString="Following" colorString="#161718" sizeString="26" />
      <MenuItem iconString="Live shopping" colorString="#161718" sizeString="26" />

      <div class="border-b lg:ml-2 mt-2" />

      <div class="lg:block hidden text-sm font-semibold text-gray-600 pt-4 pb-2 px-2">
        Categories
      </div>
      <div class="pt-3">
        <div v-for="category in categories.slice(0, 10)" :key="category.id" class="cursor-pointer">
          <CategoryItem
            :category="category.name"
            :img-uri="category.thumbnailUrl ?? 'https://picsum.photos/id/1005/32'"
            :alt-icon="category.name"
            @click="getProductsByCategory(category.name)"
            :disabled="productStore.isLoading"
          />
        </div>
        <button class="lg:block hidden text-[#f02c56] pt-1.5 pl-2 text-sm font-semibold hover:underline">
          View All
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCategoryStore, useProductStore } from '@/stores';
import MenuItem from './MenuItem.vue';
import CategoryItem from '@/layouts/children/CategoryItem.vue';
import type { CategoryInterface } from '~/models/interface/products/category.interface';

const route = useRoute();
const categoryStore = useCategoryStore();
const productStore = useProductStore();

const categories = ref<CategoryInterface[]>([]);
const error = ref<string | null>(null);

const loadCategories = async () => {
  try {
    await categoryStore.fetchCategories();
    categories.value = categoryStore.categories;
  } catch (err) {
    error.value = 'Failed to load categories.';
  }
};

const getProductsByCategory = async (categoryName: string) => {
  try {
    error.value = null;
    await productStore.filterByCategory(categoryName);
  } catch (err) {
    error.value = 'Failed to filter products by category.';
  }
};

loadCategories();
</script>
