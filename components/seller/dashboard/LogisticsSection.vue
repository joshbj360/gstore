<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-medium">Logistics Overview</h2>
      <!-- This button now links to the dedicated shipping management page -->
      <NuxtLink 
        to="/sellers/dashboard/shipping"
        class="bg-brand/10 text-brand px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand/20 transition-colors"
      >
        Manage Shipping Profiles
      </NuxtLink>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Pending Orders Summary -->
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <h3 class="font-semibold text-gray-800 mb-3">Pending Orders</h3>
        <div v-if="orders.length === 0" class="text-gray-500 text-sm">
          No pending orders. Great job!
        </div>
        <div v-else>
          <p class="text-gray-600 text-sm mb-4">
            You have {{ orders.length }} order(s) ready to be shipped.
          </p>
          <button class="text-sm font-medium text-brand hover:underline">
            View All Orders
          </button>
        </div>
      </div>

      <!-- Shipping Profiles Summary -->
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <h3 class="font-semibold text-gray-800 mb-3">Active Shipping Profiles</h3>
        <div v-if="shippingZoneCount === 0" class="text-gray-500 text-sm">
          No shipping profiles created yet.
        </div>
        <div v-else>
            <p class="text-gray-600 text-sm mb-4">
                You have {{ shippingZoneCount }} shipping profile(s) configured.
            </p>
            <p class="text-xs text-gray-500">
                These profiles determine where you can ship your products and how much it costs.
            </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// In a real component, this data would be passed as props
// or fetched from a store.
const props = defineProps<{
  orders: any[];
  shippingZoneCount: number;
}>();

</script>
