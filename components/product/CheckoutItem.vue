<template>
  <div class="flex py-4" role="listitem">
    <div class="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        <img
            :src="item.product.media[0]?.url || '/default-product.png'"
            :alt="item.product.title"
            class="w-full h-full object-cover"
        />
    </div>
    <div class="ml-4 flex-1 flex flex-col justify-center">
      <div>
        <h3 class="font-semibold text-gray-800 line-clamp-2 leading-tight">
          {{ item.product.title }}
        </h3>
        <p v-if="item.variant.size" class="text-sm text-gray-500 mt-1">
          Size: {{ item.variant.size }}
        </p>
      </div>
      <div class="flex justify-between items-baseline mt-2">
        <span class="text-sm text-gray-500">Qty: {{ item.quantity }}</span>
        <span class="font-semibold text-gray-900">{{ formatPrice(item.variant.price || item.product.price) }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CartItemInterface } from '~/models/interface/cart/cart.interface';

const props = defineProps<{
  item: CartItemInterface;
}>();

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price / 100);
};
</script>