<template>
  <article class="flex items-start gap-4 p-4 transition-colors duration-200" :class="{ 'opacity-60': isOutOfStock }">
    <div class="flex-shrink-0">
      <input 
        type="checkbox" 
        :checked="selected"
        @change="toggleSelection"
        class="h-5 w-5 rounded border-gray-300 text-brand-dark focus:ring-[#C42B78]/50"
      >
      <NuxtLink :to="`/product/${item.product.slug}`" class="block mt-4">
        <div class="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
          <img
            v-if="item.product.media && item.product.media.length"
            :src="item.product.media[0].url || '~/assets/images/men.png'"
            :alt="item.product.title"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </NuxtLink>
    </div>

    <div class="flex-1 min-w-0">
      <h3 class="font-semibold text-gray-800 line-clamp-2">
        <NuxtLink :to="`/product/${item.product.slug}`">{{ item.product.title }}</NuxtLink>
      </h3>
      
      <p v-if="item.variant.size" class="text-sm text-gray-500 mt-1">
        Size: {{ item.variant.size }}
      </p>

      <p class="font-bold text-lg text-brand-dark mt-2">
        {{ formatPrice(item.variant.price) }}
      </p>
      
      <p v-if="isOutOfStock" class="text-sm font-semibold text-brand mt-2">
        Out of Stock
      </p>

      <div class="mt-4 flex items-center justify-between">
        <div class="flex items-center border border-gray-200 rounded-lg">
          <button @click="decreaseQuantity" :disabled="localQuantity <= 1" class="px-3 py-1 text-gray-600 disabled:opacity-50">
            <Icon name="mdi:minus" size="18" />
          </button>
          <span class="px-4 text-sm font-medium">{{ localQuantity }}</span>
          <button @click="increaseQuantity" class="px-3 py-1 text-gray-600">
            <Icon name="mdi:plus" size="18" />
          </button>
        </div>

        <div class="flex items-center text-sm">
          <button @click="emitSaveForLater" class="text-gray-500 hover:text-brand-dark font-medium transition-colors">
              Save for Later
          </button>
          <div class="h-4 border-l mx-3"></div>
          <button @click="removeFromCart" class="text-gray-500 hover:text-brand font-medium transition-colors">
              Remove
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { useCartStore } from '~/stores/cart.store';
// FIX: Use the correct, updated interface
import type { ICartItem, IProduct } from '~/models';
import { notify } from "@kyvg/vue3-notification";

const props = defineProps<{
  // FIX: Use the correct, updated interface
  item: ICartItem 
  selected: boolean,
}>();

const emit = defineEmits<{
  (e: 'selected', value: { item: ICartItem; selected: boolean }): void,
  (e: 'save-for-later', item: ICartItem): void,
}>();

const cartStore = useCartStore();
const localQuantity = ref(props.item.quantity || 1);

// This now correctly checks the stock of the specific variant
const isOutOfStock = computed(() => (props.item.variant.stock ?? 0) <= 0);

watch(() => props.item.quantity, (newValue) => {
  localQuantity.value = newValue || 1;
});

const toggleSelection = (event: Event) => {
  const isSelected = (event.target as HTMLInputElement).checked;
  emit('selected', { item: props.item, selected: isSelected });
};

const updateQuantity = () => {
  // The store's updateCartItem action will use the item's unique id ('productID-variantID')
  cartStore.updateCartItem({ ...props.item, quantity: localQuantity.value });
};

const decreaseQuantity = () => {
  if (localQuantity.value > 1) {
    localQuantity.value--;
    updateQuantity();
  }
};

const increaseQuantity = () => {
  if (localQuantity.value < props.item.variant.stock) {
    localQuantity.value++;
    updateQuantity();
  } else {
    notify({ type: 'warn', text: 'No more items in stock.' });
  }
};

const removeFromCart = () => {
  if (confirm(`Are you sure you want to remove "${props.item.product.title}" (${props.item.variant.size}) from your cart?`)) {
    // FIX: Pass the unique cart item ID to the store action.
    cartStore.removeFromCart(props.item.id);
    notify({ type: 'success', text: 'Item removed from cart.' });
  }
};

const emitSaveForLater = () => {
  emit('save-for-later', props.item);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price / 100);
};
</script>