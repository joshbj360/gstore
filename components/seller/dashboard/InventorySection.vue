<template>
  <div>
    <h2 class="text-lg font-medium mb-4">Inventory</h2>
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <table class="w-full">
        <thead>
          <tr class="text-left text-gray-600">
            <th>Product</th>
            <th>Stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id" class="border-t">
            <td class="py-2">{{ product.title }}</td>
            <td>{{ product.stock || 0 }}</td>
            <td>
              <span v-if="product.stock <= 5" class="text-brand">Low Stock</span>
              <span v-else class="text-[#009A66]">In Stock</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ products: any[] }>();
</script>