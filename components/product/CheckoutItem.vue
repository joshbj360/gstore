<template>
  <div class="py-4 flex gap-4">
    <img 
      v-if="item.product.media && item.product.media.length"
      :src="item.product?.media[0].url" 
      class="w-16 h-16 rounded-md object-cover"
    >
    <div v-else class="w-16 h-16 rounded-md bg-gray-100 dark:bg-neutral-800"></div>

    <div class="flex-1 min-w-0">
      <p class="font-semibold text-sm text-gray-800 dark:text-neutral-100 line-clamp-1">{{ item.product?.title }}</p>
      <p class="text-sm text-gray-500 dark:text-neutral-400">Size: {{ item.variant.size }}</p>
      <p class="text-sm text-gray-500 dark:text-neutral-400">Qty: {{ item.quantity }}</p>
    </div>

    <div class="text-sm font-medium text-gray-900 dark:text-neutral-100">
      {{ formatPrice((item.variant.price || item.product.price) * item.quantity) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ICartItem } from '~/models';
import { formatPrice } from '~/utils/formatters';

defineProps<{ item: ICartItem }>();
</script>