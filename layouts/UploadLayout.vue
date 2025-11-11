<template>
    <!-- 
      THE FIX: The layout now defaults to light mode (bg-gray-50)
      and uses dark: prefixes for the dark theme (dark:bg-neutral-900)
    -->
    <div class="min-h-screen w-full bg-gray-50 dark:bg-neutral-900">
        <!-- Sticky Header: Now fully theme-compliant -->
        <header class="sticky top-0 z-20 bg-white/95 dark:bg-neutral-950/90 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-neutral-800">
            <div class="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                <button 
                    @click="router.back()"
                    class="flex items-center space-x-2 text-gray-700 dark:text-neutral-300 hover:text-brand transition-colors duration-200 focus:outline-none rounded-md p-1"
                    aria-label="Back"
                >
                    <Icon name="mdi:arrow-left" size="24" />
                    <span class="hidden sm:inline font-medium text-sm">Back</span>
                </button>
                
                <div class="flex-1 text-center">
                    <h1 class="text-lg font-semibold text-gray-900 dark:text-neutral-100">Upload Center</h1>
                </div>
                
                <!-- Actions: Styled for dark mode -->
                <div class="flex space-x-2">
                    <button @click="$emit('save-draft')" class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-100 transition-colors">
                        Draft
                    </button>
                    <button @click="$emit('publish')" class="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-light transition-colors">
                        Publish
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Content: Now has better padding -->
        <main class="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
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