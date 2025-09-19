<template>
  <div class="fixed top-14 left-0 w-full bg-white md:hidden z-30 shadow-sm">
    <div class="relative flex items-center">
      <!-- Fading effect for the edges -->
      <div class="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10"></div>
      <div class="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10"></div>

      <!-- Scrollable Category List -->
      <div
        ref="scrollContainer"
        class="flex overflow-x-auto gap-2 py-3 px-4 scroll-smooth no-scrollbar"
      >
        <!-- "All" Category Link -->
        <NuxtLink
          to="/"
          class="flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300"
          :class="isActive(null) ? 'bg-brand text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          All
        </NuxtLink>

        <!-- Dynamic Category Links -->
        <NuxtLink
          v-for="category in categoryStore.categories"
          :key="category.id"
          :to="`/category/${category.slug}`"
          class="flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300"
          :class="isActive(category.name) ? 'bg-brand text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          {{ category.name }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCategoryStore } from '~/stores';

const categoryStore = useCategoryStore();
const route = useRoute();
const scrollContainer = ref<HTMLDivElement | null>(null);

// Check if a category is active based on the URL query
const isActive = (categoryName: string | null) => {
  const currentCategory = route.query.category;
  if (categoryName === null && !currentCategory) {
    return true; // "All" is active when no category is in the URL
  }
  return currentCategory === categoryName;
};

// Fetch categories only if the store is empty
onMounted(() => {
  if (categoryStore.categories.length === 0) {
    try {
      categoryStore.fetchCategories();
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>