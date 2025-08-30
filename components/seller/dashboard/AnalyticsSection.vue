<template>
  <div>
    <h2 class="text-lg font-medium mb-4">Analytics</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-600">Total Sales</h3>
        <p class="text-2xl font-bold text-brand-dark">${{ sales }}</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-600">Product Views</h3>
        <p class="text-2xl font-bold text-brand-dark">{{ views }}</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-600">Conversion Rate</h3>
        <p class="text-2xl font-bold text-brand-dark">{{ conversion }}%</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const sales = ref(0);
const views = ref(0);
const conversion = ref(0);

onMounted(async () => {
  const response = await $fetch('/api/prisma/analytics');
  sales.value = response.sales;
  views.value = response.views;
  conversion.value = response.conversion;
});
</script>