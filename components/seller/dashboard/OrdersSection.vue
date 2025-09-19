<template>
  <div>
    <h2 class="text-lg font-medium mb-4">Orders</h2>
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <div class="mb-4">
        <button
          v-for="status in ['PENDING', 'COMPLETED', 'CANCELED']"
          :key="status"
          @click="activeStatus = status"
          class="mr-2 px-4 py-2 rounded-lg"
          :class="{ 'bg-brand text-white': activeStatus === status, 'bg-gray-200': activeStatus !== status }"
        >
          {{ status }}
        </button>
      </div>
      <table class="w-full">
        <thead>
          <tr class="text-left text-gray-600">
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id" class="border-t">
            <td class="py-2">{{ order.id }}</td>
            <td>{{ order.name }}</td>
            <td>${{ (order.totalAmount / 100).toFixed(2) }}</td>
            <td>
              <span :class="{ 'text-[#009A66]': order.status === 'COMPLETED', 'text-red-500': order.status === 'CANCELED' }">
                {{ order.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{ orders: any[] }>();
const activeStatus = ref('PENDING');

const filteredOrders = computed(() => {
  return props.orders.filter(order => order.status === activeStatus.value);
});
</script>