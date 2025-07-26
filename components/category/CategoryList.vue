<template>
  <div class="fixed top-[60px] left-0 w-full bg-white md:hidden z-40 shadow-sm">
    <div class="relative flex items-center overflow-hidden">
      <!-- Scrollable Category List -->
      <div
        ref="scrollContainer"
        class="flex overflow-x-auto gap-2 py-2 px-4 scroll-smooth no-scrollbar"
      >
        <button
          v-for="category in categories"
          :key="category.id"
          class="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-[#f02c56] hover:text-white transition-all duration-300"
          :disabled="productStore.isLoading"
          @click="getProductsByCategory(category.name)"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Scroll Buttons -->
      <button
        v-show="showScrollButtons"
        class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white text-gray-600 p-1.5 rounded-full shadow-md z-10 hover:bg-gray-100 transition"
        @click="scrollLeft"
      >
        <Icon name="mdi:chevron-left" size="20" />
      </button>
      <button
        v-show="showScrollButtons"
        class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-gray-600 p-1.5 rounded-full shadow-md z-10 hover:bg-gray-100 transition"
        @click="scrollRight"
      >
        <Icon name="mdi:chevron-right" size="20" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCategoryStore, useProductStore } from '~/stores';
import type { CategoryInterface } from '~/models/interface/products/category.interface';

const categoryStore = useCategoryStore();
const productStore = useProductStore();

const categories = ref<CategoryInterface[]>([]);
const scrollContainer = ref<HTMLDivElement | null>(null);
const showScrollButtons = ref(true);

const loadCategories = async () => {
  try {
    await categoryStore.fetchCategories();
    categories.value = categoryStore.categories;
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
};

const getProductsByCategory = async (categoryName: string) => {
  try {
    await productStore.filterByCategory(categoryName);
  } catch (err) {
    console.error('Failed to filter products by category:', err);
  }
};

const scrollLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: -120, behavior: 'smooth' });
  }
};

const scrollRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: 120, behavior: 'smooth' });
  }
};

// Check if scroll buttons are needed
onMounted(async () => {
  await loadCategories();
  if (scrollContainer.value) {
    showScrollButtons.value = scrollContainer.value.scrollWidth > scrollContainer.value.clientWidth;
  }
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
button:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>