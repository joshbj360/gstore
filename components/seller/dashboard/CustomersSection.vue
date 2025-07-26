<template>
  <div>
    <h2 class="text-lg font-medium mb-4">Customers</h2>
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <table class="w-full">
        <thead>
          <tr class="text-left text-gray-600">
            <th>Name</th>
            <th>Email</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in customers" :key="customer.id" class="border-t">
            <td class="py-2">{{ customer.name || 'N/A' }}</td>
            <td>{{ customer.email }}</td>
            <td>{{ customer.orders?.length || 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ customers: any[] }>();
</script>