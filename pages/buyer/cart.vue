<template>
  <HomeLayout>
    <div class="space-y-6">
      <div class="px-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-neutral-100">Shopping Cart</h1>
      </div>
      
      <CartSkeleton v-if="pending" />
      
      <div v-else-if="error" class="text-center py-20">
        <p class="text-brand-dark dark:text-brand-light">Could not load your cart.</p>
      </div>

      <div v-else-if="cartStore.cartCount === 0 && savedForLaterItems.length === 0" class="text-center py-16">
        <Icon name="mdi:cart-remove" size="64" class="mx-auto text-gray-300 dark:text-neutral-700 mb-4" />
        <h2 class="text-2xl font-bold text-gray-800 dark:text-neutral-200">Your cart is empty</h2>
        <p class="text-gray-500 dark:text-neutral-400 mt-2 mb-6">Looks like you haven't added anything yet.</p>
        <NuxtLink to="/discover" class="px-6 py-3 bg-brand text-white font-semibold rounded-lg shadow-md hover:bg-brand-light transition-transform hover:scale-105">
          Continue Shopping
        </NuxtLink>
      </div>

      <div v-else class="space-y-6">
        <div v-if="cartStore.cartCount > 0" class="bg-white dark:bg-neutral-950 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-neutral-800">
          <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-neutral-800">
            <div class="flex items-center">
              <input type="checkbox" v-model="selectAll" class="h-5 w-5 rounded border-gray-300 dark:border-neutral-600 text-brand focus:ring-[#f02c56]/50">
              <label for="select-all" class="ml-3 text-sm font-medium text-gray-700 dark:text-neutral-300">
                Select All ({{ cartStore.cartCount }} item{{ cartStore.cartCount !== 1 ? 's' : '' }})
              </label>
            </div>
            <button @click="removeSelectedItems" :disabled="!selectedItems.length" class="text-sm text-brand hover:underline disabled:text-gray-400 dark:disabled:text-neutral-600">
              Delete Selected
            </button>
          </div>
          <transition-group name="cart-item" tag="div" class="divide-y divide-gray-200 dark:divide-neutral-800">
            <CartItem
              v-for="item in cartStore.cartItemsArray"
              :key="item.variantId" 
              :item="item"
              :selected="isSelected(item)"
              @selected="toggleProductSelection"
              @save-for-later="saveItemForLater"
              class="cart-item py-6"
            />
          </transition-group>
        </div>
        
        <div v-if="savedForLaterItems.length > 0" class="bg-white dark:bg-neutral-950 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-neutral-800">
          <h2 class="text-xl font-bold text-gray-900 dark:text-neutral-100 mb-4">Saved for Later ({{ savedForLaterItems.length }})</h2>
          <div class="divide-y divide-gray-200 dark:divide-neutral-800">
              </div>
        </div>
      </div>
      
      <div class="h-34 lg:hidden"></div>
    </div>

    <template #right-sidebar>
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-neutral-800 sticky top-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-neutral-100 mb-4">Order Summary</h2>
          <div class="space-y-3">
            <div class="flex justify-between text-gray-600 dark:text-neutral-300">
              <span>Subtotal ({{ selectedItems.length }} items)</span>
              <span class="font-medium text-gray-900 dark:text-neutral-100">{{ formatPrice(totalPriceComputed) }}</span>
            </div>
            <div class="flex justify-between text-gray-600 dark:text-neutral-300">
              <span>Shipping</span>
              <span class="font-medium text-green-600 dark:text-green-400">Free</span>
            </div>
            <div class="border-t border-gray-200 dark:border-neutral-700 pt-4 mt-4">
              <div class="flex justify-between text-gray-900 dark:text-neutral-100 font-bold text-lg">
                <span>Order Total</span>
                <span>{{ formatPrice(totalPriceComputed) }}</span>
              </div>
            </div>
          </div>
          <button @click="goToCheckout" :disabled="!selectedItems.length" class="mt-6 w-full bg-brand text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-brand-light transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed">
            Proceed to Checkout
          </button>
        </div>
    </template>

    <template #left-sidebar></template>
  </HomeLayout>

  <div class="lg:hidden fixed bottom-14 left-0 right-0 z-10 p-4 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 shadow-lg">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-600 dark:text-neutral-400">Total ({{ selectedItems.length }} items)</span>
        <span class="font-bold text-lg text-gray-900 dark:text-neutral-100">{{ formatPrice(totalPriceComputed) }}</span>
      </div>
      <button @click="goToCheckout" :disabled="!selectedItems.length" class="w-full bg-brand text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-70">
        Proceed to Checkout
      </button>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore, useUserStore } from '~/stores';
import CartItem from '~/components/product/CartItem.vue';
import CartSkeleton from '~/components/skeletons/CartSkeleton.vue';
import HomeLayout from '~/layouts/HomeLayout.vue';
import type { IProduct, ICartItem } from '~/models';
import { notify } from '@kyvg/vue3-notification';

definePageMeta({ layout: false }); // We use HomeLayout directly

const router = useRouter();
const cartStore = useCartStore();
const userStore = useUserStore();

const selectedItems = ref<ICartItem[]>([]);
const savedForLaterItems = ref<ICartItem[]>([]);

const { pending, error } = await useLazyAsyncData(
    'cart-items',
    () => cartStore.fetchCartItems(),
    { server: userStore.isLoggedIn }
);

// "Select All" logic - uses cartCount and cartItemsArray
const selectAll = computed({
  get: () => cartStore.cartCount > 0 && selectedItems.value.length === cartStore.cartCount,
  set: (value) => {
    selectedItems.value = value ? cartStore.cartItemsArray : [];
  }
});

// Uses variantId for stable comparison
const isSelected = (item: ICartItem) => selectedItems.value.some(p => p.variantId === item.variantId);

// Uses variantId for stable comparison
const toggleProductSelection = (data: { item: ICartItem, selected: boolean }) => {
  const { item, selected } = data;
  const index = selectedItems.value.findIndex(p => p.variantId === item.variantId);
  if (selected && index === -1) {
    selectedItems.value.push({ ...item });
  } else if (!selected && index > -1) {
    selectedItems.value.splice(index, 1);
  }
};

// Calls removeFromCart with variantId
const removeSelectedItems = () => {
    if(!confirm('Are you sure you want to remove the selected items?')) return;
    selectedItems.value.forEach(item => cartStore.removeFromCart(item.variantId));
    selectedItems.value = [];
    notify({ type: 'success', text: 'Selected items removed.' });
};

// Calls removeFromCart with variantId
const saveItemForLater = (item: ICartItem) => {
    savedForLaterItems.value.push(item);
    cartStore.removeFromCart(item.variantId);
    notify({ type: 'info', text: `${item.product?.title} saved for later.` });
};

const moveToCart = (item: ICartItem) => {
  if(item.product){
    cartStore.addToCart( item.product, item.variant, item.quantity);
    // Assumes savedForLaterItems also use variantId as a key
    savedForLaterItems.value = savedForLaterItems.value.filter(p => p.variantId !== item.variantId);
  }
};

const totalPriceComputed = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + ((item.variant?.price || item.product.price || 0) * item.quantity), 0);
});

const goToCheckout = () => {
  cartStore.checkout = [...selectedItems.value];
  router.push('/buyer/shipping/checkout');
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price / 100);
};
</script>

<style scoped>
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.3s ease;
}
.cart-item-enter-from,
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>