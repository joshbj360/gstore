<template>
  <div class="flex items-start gap-4">
    <input 
      type="checkbox" 
      :checked="selected" 
      @change="$emit('selected', { item: item, selected: ($event.target as HTMLInputElement).checked })"
      class="h-5 w-5 rounded border-gray-300 dark:border-neutral-600 text-brand focus:ring-[#f02c56]/50 mt-1"
    />
    <img 
      v-if="item.product.media && item.product.media.length"
      :src="item.product?.media[0].url" 
      class="w-20 h-20 rounded-md object-cover"
    >
    <div v-else class="w-20 h-20 rounded-md bg-gray-100 dark:bg-neutral-800"></div>

    <div class="flex-1 min-w-0">
      <p class="font-semibold text-sm text-gray-800 dark:text-neutral-100 line-clamp-1">{{ item.product?.title }}</p>
      <p class="text-sm text-gray-500 dark:text-neutral-400">Size: {{ item.variant.size }}</p>
      <p class="text-lg font-bold text-gray-900 dark:text-neutral-100 mt-1">{{ formatPrice(item.variant.price || item.product.price) }}</p>
      
      <!-- Quantity Control -->
      <div class="flex items-center border border-gray-200 dark:border-neutral-700 rounded-md w-fit mt-2">
        <button @click="updateQuantity(item.quantity - 1)" :disabled="item.quantity <= 1" class="px-2 py-1 text-gray-600 dark:text-neutral-400 disabled:opacity-50">
          <Icon name="mdi:minus" size="16" />
        </button>
        <span class="px-3 text-sm font-medium">{{ item.quantity }}</span>
        <button @click="updateQuantity(item.quantity + 1)" class="px-2 py-1 text-gray-600 dark:text-neutral-400">
          <Icon name="mdi:plus" size="16" />
        </button>
      </div>
    </div>

    <div class="flex flex-col items-end gap-2">
      <button @click="cartStore.removeFromCart(item.id)" class="p-1 text-gray-400 dark:text-neutral-500 hover:text-brand-dark dark:hover:text-brand-light">
        <Icon name="mdi:trash-can-outline" size="20" />
      </button>
      <button @click="$emit('save-for-later', item)" class="text-xs font-medium text-gray-600 dark:text-neutral-400 hover:underline">
        Save for later
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart.store';
import type { ICartItem } from '~/models';
import { formatPrice } from '~/utils/formatters';

const props = defineProps<{
  item: ICartItem;
  selected: boolean;
}>();

const emit = defineEmits(['selected', 'save-for-later']);

const cartStore = useCartStore();

const updateQuantity = (quantity: number) => {
  if (quantity > 0) {
    cartStore.updateItemQuantity(props.item.id, quantity);
  }
};
</script>