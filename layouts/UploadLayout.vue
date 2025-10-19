<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sticky Header: Clean, Responsive Back Nav -->
    <header class="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <button 
          @click="router.back()"
          class="flex items-center space-x-2 text-gray-700 hover:text-brand transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/20 rounded-md p-1"
          aria-label="Back to Home"
        >
          <Icon name="mdi:arrow-left" size="24" />
          <span class="hidden sm:inline font-medium text-sm">Back</span>
        </button>
        
        <!-- Optional: Upload Progress or Title (Props-Driven) -->
        <div v-if="$slots.title" class="flex-1 text-center">
          <slot name="title" />
        </div>
        <div v-else class="flex-1 text-center">
          <h1 class="text-lg font-semibold text-gray-900">Upload Center</h1>
        </div>
        
        <!-- Actions: Future-Proof for Save/Draft -->
        <div class="flex space-x-2">
          <button @click="$emit('save-draft')" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
            Draft
          </button>
          <button @click="$emit('publish')" class="px-4 py-2 text-sm font-medium text-brand hover:text-brand-dark transition-colors">
            Publish
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content: Responsive, Spaced Container -->
    <main class="space-y-2 p-4 sm:p-0 lg:p-0 container mx-auto max-w-6xl">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const emit = defineEmits<{
  'save-draft': [];
  'publish': [];
}>();

const navigateHome = () => {
  router.push('/');
};
</script>

<style scoped>
/* No custom CSS needed—Tailwind handles the cool */
</style>