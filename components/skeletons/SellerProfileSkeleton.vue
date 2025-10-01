<template>
  <div class="min-h-screen bg-gray-50 animate-pulse">
    <!-- Header Skeleton -->
    <div class="h-16 bg-white border-b"></div>

    <!-- Cover Image Skeleton -->
    <div class="h-48 bg-gray-200"></div>

    <!-- Profile Section Skeleton -->
    <div class="p-4 max-w-6xl mx-auto">
      <div class="flex items-end gap-4 -mt-16">
        <div class="w-24 h-24 rounded-full bg-gray-300 border-4 border-gray-50"></div>
        <div class="flex-1 space-y-2 pb-2">
          <div class="h-8 w-1/3 bg-gray-300 rounded"></div>
          <div class="h-4 w-1/2 bg-gray-200 rounded"></div>
        </div>
      </div>

      <!-- Stats Bar Skeleton -->
      <div class="flex justify-around py-4 border-y mt-4">
        <div class="h-12 w-20 bg-gray-200 rounded-md"></div>
        <div class="h-12 w-20 bg-gray-200 rounded-md"></div>
        <div class="h-12 w-20 bg-gray-200 rounded-md"></div>
      </div>

      <!-- Tabs Skeleton -->
      <div class="h-12 bg-gray-200 rounded-md mt-8"></div>

      <!-- Products Grid Skeleton -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div v-for="i in 4" :key="i" class="w-full h-72 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
</template>
