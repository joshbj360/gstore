<template>
  <div class="relative min-h-screen bg-gray-900 animate-pulse">
    <!-- Placeholder for Back Button -->
    <div class="absolute top-4 left-4 z-40 h-10 w-10 bg-gray-700 rounded-full"></div>

    <!-- Main Media Area Placeholder -->
    <div class="h-screen w-full flex items-center justify-center">
      <div class="w-full h-full bg-gray-800"></div>
    </div>

    <!-- Product Info Placeholder -->
    <div class="absolute bottom-0 left-0 right-0 p-6">
      <div class="h-6 w-3/4 bg-gray-700 rounded mb-2"></div>
      <div class="h-8 w-1/2 bg-gray-700 rounded"></div>
    </div>

    <!-- Side Panel Placeholder -->
    <div class="fixed right-4 bottom-16 flex flex-col items-center gap-4 z-30">
      <div v-for="i in 5" :key="i" class="h-12 w-12 bg-gray-700 rounded-full"></div>
    </div>
  </div>
</template>