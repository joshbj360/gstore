<template>
  <div class="text-gray-900 dark:text-neutral-100">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">Your Products</h2>
        <p class="text-sm text-gray-600 dark:text-neutral-400 mt-1">Manage your inventory and product status.</p>
      </div>
      <NuxtLink to="/seller/upload" class="flex-shrink-0 px-4 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2">
        <Icon name="mdi:plus" size="20" />
        <span>Add New Product</span>
      </NuxtLink>
    </div>

    <nav class="flex border-b border-gray-200 dark:border-neutral-700 mb-6">
      </nav>

    <div class="bg-white dark:bg-neutral-950 rounded-lg shadow-md border border-gray-200 dark:border-neutral-800 overflow-x-auto">
      <div v-if="visibleProducts.length === 0" class="text-center p-12 text-gray-500 dark:text-neutral-500">
        </div>
      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
        <thead class="bg-gray-50 dark:bg-neutral-800">
          <tr>
            <th scope="col" class="table-header">Product</th>
            <th scope="col" class="table-header">Stock</th>
            <th scope="col" class="table-header">Price (₦)</th>
            <th scope="col" class="table-header">Likes</th>
             <th scope="col" class="table-header">Sold</th>
            <th scope="col" class="table-header text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-neutral-800">
          <tr v-for="product in visibleProducts" :key="product.id" class="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <img :src="getMediaThumbnailUrl(product?.media?.[0]) || 'https://placehold.co/64x64/f3f4f6/9ca3af?text=Img'"
                  class="w-10 h-10 rounded-md object-cover" />
                <div class="flex-1 min-w-0">
                   <p class="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">{{ product.title }}</p>
                </div>
              </div>
            </td>
            <td class="table-cell">
               <span :class="getTotalStock(product?.variants) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-brand-light'">
                {{ getTotalStock(product?.variants) }} in stock
              </span>
            </td>
            <td class="table-cell font-medium">{{ formatPrice(product.price) }}</td>
            <td class="table-cell">{{ product._count?.likes || 0 }}</td>
            <td class="table-cell">{{ product.soldCount || 0 }}</td>
            
            <td class="table-cell text-center">
              <NuxtLink 
                :to="`/seller/upload?edit=${product.slug}`" 
                class="action-button text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" 
                title="Edit"
              >
                <Icon name="mdi:pencil-outline" size="18" />
              </NuxtLink>
              
              <button classV-else="action-button text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 ml-2" title="Archive">
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
// THE FIX: Import getMediaThumbnailUrl
import { formatPrice, getMediaThumbnailUrl } from '~/utils/formatters';

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
    @apply px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider;
}
.table-cell {
    @apply px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-neutral-300;
}
.action-button {
    @apply p-1.5 rounded-full transition-colors inline-block;
}
</style>