<template>
  <div class="bg-gray-50 min-h-screen">
    <header class="sticky top-0 z-20 bg-white shadow-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <NuxtLink to="/" aria-label="Go to homepage">
          <img src="~/assets/images/grandeur-logo.png" alt="Grandeur Logo" class="h-8 w-auto" />
        </NuxtLink>

        <NuxtLink to="/" class="hidden sm:inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm border border-[#f02c56] text-[#f02c56] hover:bg-[#f02c56]/10 transition-colors">
          <Icon name="mdi:store-outline" class="mr-2" size="18"/>
          Continue Shopping
        </NuxtLink>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="bg-white mt-12 py-6 border-t">
        <div class="max-w-6xl mx-auto text-center text-sm text-gray-500">
            <p>&copy; {{ new Date().getFullYear() }} Grandeur Shop. All rights reserved.</p>
        </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// No script logic is needed for this simple, presentational layout
</script>