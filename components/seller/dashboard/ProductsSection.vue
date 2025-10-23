<template>
  <div class="text-neutral-100">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-bold text-neutral-100">Your Products</h2>
        <p class="text-sm text-neutral-400 mt-1">Manage your inventory and product status.</p>
      </div>
      <NuxtLink to="/upload" class="flex-shrink-0 px-4 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-[#d81b36] transition-colors flex items-center justify-center gap-2">
        <Icon name="mdi:plus" size="20" />
        <span>Add New Product</span>
      </NuxtLink>
    </div>

    <!-- Tab Navigation -->
    <nav class="flex border-b border-neutral-700 mb-6">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" class="px-4 py-3 text-sm font-medium flex items-center"
        :class="[
          activeTab === tab.id
            ? 'text-brand border-b-2 border-brand'
            : 'text-neutral-400 hover:text-neutral-100 hover:border-b-2 hover:border-neutral-500'
        ]">
        {{ tab.label }}
        <span class="ml-2 text-xs bg-neutral-700 px-1.5 py-0.5 rounded-full">{{ getCount(tab.id) }}</span>
      </button>
    </nav>

    <!-- Products Table -->
    <div class="bg-neutral-950 rounded-lg shadow-md border border-neutral-800 overflow-x-auto">
      <div v-if="visibleProducts.length === 0" class="text-center p-12 text-neutral-500">
        <Icon name="mdi:package-variant-closed-remove" size="48" class="mx-auto mb-4" />
        <p>No products found in this category.</p>
      </div>
      <table v-else class="min-w-full divide-y divide-neutral-800">
        <thead class="bg-neutral-800">
          <tr>
            <th scope="col" class="table-header">Product</th>
            <th scope="col" class="table-header">Stock</th>
            <th scope="col" class="table-header">Price (₦)</th>
            <th scope="col" class="table-header">Likes</th>
            <th scope="col" class="table-header">Sold</th>
            <th scope="col" class="table-header text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-800">
          <tr v-for="product in visibleProducts" :key="product.id" class="hover:bg-neutral-800/50">
            <!-- Product Column -->
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <img :src="getMediaThumbnailUrl(product?.media?.[0]) || 'https://placehold.co/64x64/333333/555555?text=Img'"
                  class="w-10 h-10 rounded-md object-cover" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-neutral-100 truncate">{{ product.title }}</p>
                </div>
              </div>
            </td>
            <!-- Stock Column -->
            <td class="table-cell">
              <span :class="getTotalStock(product?.variants) > 0 ? 'text-green-400' : 'text-red-400'">
                {{ getTotalStock(product?.variants) }} in stock
              </span>
            </td>
            <!-- Price Column -->
            <td class="table-cell font-medium">{{ formatPrice(product.price) }}</td>
            <!-- Likes Column -->
            <td class="table-cell">{{ product._count?.likes || 0 }}</td>
            <!-- Sold Column -->
            <td class="table-cell">{{ product.soldCount || 0 }}</td>
            <!-- Actions Column -->
            <td class="table-cell text-center">
              <button class="action-button text-blue-400 hover:bg-blue-900/50" title="Edit">
                <Icon name="mdi:pencil-outline" size="18" />
              </button>
              <button class="action-button text-yellow-400 hover:bg-yellow-900/50 ml-2" title="Archive">
                <Icon name="mdi:archive-arrow-down-outline" size="18" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { IProduct, IProductVariant } from '~/models';
import { formatPrice } from '~/utils/formatters';

const props = defineProps<{ products: IProduct[] }>();

type ProductStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

const activeTab = ref<ProductStatus | 'ALL'>('PUBLISHED');

const tabs: Array<{ id: ProductStatus | 'ALL'; label: string }> = [
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'ARCHIVED', label: 'Archived' },
  { id: 'ALL', label: 'All' },
];

// Computed properties to filter products based on the active tab
const publishedProducts = computed(() => props.products.filter(p => p.status === 'PUBLISHED'));
const draftProducts = computed(() => props.products.filter(p => p.status === 'DRAFT'));
const archivedProducts = computed(() => props.products.filter(p => p.status === 'ARCHIVED'));

const visibleProducts = computed(() => {
  switch (activeTab.value) {
    case 'PUBLISHED': return publishedProducts.value;
    case 'DRAFT': return draftProducts.value;
    case 'ARCHIVED': return archivedProducts.value;
    case 'ALL': return props.products;
    default: return [];
  }
});

const getCount = (status: ProductStatus | 'ALL') => {
  switch (status) {
    case 'PUBLISHED': return publishedProducts.value.length;
    case 'DRAFT': return draftProducts.value.length;
    case 'ARCHIVED': return archivedProducts.value.length;
    case 'ALL': return props.products.length;
  }
};

const getTotalStock = (variants?: IProductVariant[]) => {
  if (!variants) return 0;
  return variants.reduce((total, variant) => total + (variant.stock || 0), 0);
};
</script>

<style scoped>
.table-header {
    @apply px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider;
}
.table-cell {
    @apply px-4 py-3 whitespace-nowrap text-sm text-neutral-300;
}
.action-button {
    @apply p-1.5 rounded-full transition-colors;
}
</style>

