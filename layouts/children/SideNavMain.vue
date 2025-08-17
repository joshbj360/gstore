<template>
  <div
    id="side-nav-main"
    class="fixed z-20 bg-white pt-[70px] h-full lg:w-72 w-60 overflow-y-auto border-r"
  >
    <div class="px-4 py-6">
      <!-- Main Navigation Links -->
      <div class="space-y-2 mb-8">
        <div v-for="item in mainNavLinks" :key="item.text">
          <NuxtLink :to="item.path">
            <MenuItem 
              :icon="item.icon" 
              :color="isActive(item.path) ? '#f02c56' : '#161718'" 
              :size="item.size" 
              :text="item.text" 
            />
          </NuxtLink>
        </div>
      </div>

      <div class="border-b" />

      <!-- Categories Section -->
      <div class="mt-8">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
          Top Categories
        </h3>
        <div v-if="categoryStore.categories.length" class="space-y-1">
          <!-- Use NuxtLink for proper navigation -->
          <NuxtLink
            v-for="category in categoryStore.categories.slice(0, 8)"
            :key="category.id"
            :to="`/?category=${category.name}`"
            class="block"
          >
            <CategoryItem
              :category="category.name"
              :img-uri="category.thumbnailCatUrl || 'https://picsum.photos/id/1005/32'"
            />
          </NuxtLink>
        </div>
        <p v-else class="text-sm text-gray-400 px-2">Loading categories...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCategoryStore } from '@/stores';
import MenuItem from './MenuItem.vue';
import CategoryItem from '@/layouts/children/CategoryItem.vue';

const categoryStore = useCategoryStore();
const route = useRoute();

// Structured data for main navigation links
const mainNavLinks = ref([
  { path: '/', icon: 'mdi:home-outline', text: 'Home', size: '24' },
  { path: '/discover', icon: 'mdi:compass-outline', text: 'Discover', size: '24' },
  { path: '/trending', icon: 'mdi:fire', text: 'Trending', size: '24' },
]);

// Function to check if a link is active
const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

// Fetch categories only if they aren't already in the store
onMounted(() => {
  if (categoryStore.categories.length === 0) {
    categoryStore.fetchCategories();
  }
});
</script>