<template>
        <header class="sticky top-0 z-10 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center">
        <button 
          @click="navigateHome"
          class="flex items-center text-gray-700 hover:text-brand-dark transition-colors"
        >
          <Icon name="mdi:arrow-left" size="24" class="mr-2" />
          <span class="font-medium">Back to Home</span>
        </button>
      </div>
    </header>
     <main class="space-y-0 p-4 sm:p-6 container mx-auto">
        <slot />
      </main>
</template>

<script setup lang="ts">
const router = useRouter()
const navigateHome = () => {
  router.push('/');
};
</script>