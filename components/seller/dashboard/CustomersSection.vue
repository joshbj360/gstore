<template>
  <div class="text-gray-900 dark:text-neutral-100">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">Your Customers</h2>
        <p class="text-sm text-gray-600 dark:text-neutral-400 mt-1">Analytics of your most valuable customers.</p>
      </div>
    </div>
    
    <div class="bg-white dark:bg-neutral-950 rounded-lg shadow-md border border-gray-200 dark:border-neutral-800 overflow-x-auto">
      <div v-if="!customers || customers.length === 0" class="text-center p-12 text-gray-500 dark:text-neutral-500">
        <Icon name="mdi:account-group-outline" size="48" class="mx-auto mb-4" />
        <p>No customer data yet. Fulfill an order to get started!</p>
      </div>
      
      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
        <thead class="bg-gray-50 dark:bg-neutral-800">
          <tr>
            <th scope="col" class="table-header">Customer</th>
            <th scope="col" class="table-header">Status</th>
            <th scope="col" class="table-header text-right">Total Spent</th>
            <th scope="col" class="table-header text-right">Orders</th>
            <th scope="col" class="table-header">Last Order</th>
            <th scope="col" class="table-header text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-neutral-800">
          <tr v-for="customer in customers" :key="customer.id" class="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <img :src="formatAvatarUrl(customer.username)"
                  class="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700" />
                <div class="flex-1 min-w-0">
                   <p class="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">{{ customer.username }}</p>
                   <p class="text-xs text-gray-500 dark:text-neutral-400 truncate">{{ customer.email }}</p>
                </div>
              </div>
            </td>
            <td class="table-cell">
              <span class="status-badge" :class="customer.orderCount > 1 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'">
                {{ customer.orderCount > 1 ? 'Repeat' : 'New' }}
              </span>
            </td>
            <td class="table-cell text-right font-medium">{{ formatPrice(customer.totalSpent) }}</td>
            <td class="table-cell text-right">{{ customer.orderCount }}</td>
            <td class="table-cell">{{ customer.lastOrderDate.toLocaleDateString() }}</td>
            <td class="table-cell text-center">
              <button class="action-button text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" title="View Profile">
                <Icon name="mdi:eye-outline" size="18" />
              </button>
              <button class="action-button text-brand dark:text-brand-light hover:bg-brand/10 dark:hover:bg-brand/20 ml-2" title="Send Message">
                 <Icon name="mdi:message-outline" size="18" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// THE FIX: Import formatters
import { formatPrice, formatAvatarUrl } from '~/utils/formatters';

// THE FIX: Define the prop to accept the new rich customer data
defineProps<{ 
  customers: Array<{
    id: string;
    username: string;
    email: string;
    totalSpent: number;
    orderCount: number;
    lastOrderDate: Date;
  }> 
}>();
</script>

<style scoped>
/* Copied styles from your OrdersSection for consistency */
.table-header {
    @apply px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider;
}
.table-cell {
    @apply px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-neutral-300;
}
.status-badge {
    @apply px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full;
}
.action-button {
    @apply p-1.5 rounded-full transition-colors;
}
</style>