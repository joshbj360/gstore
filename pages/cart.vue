<template>
  <div id="ShoppingCartPage" class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="!cartStore.cartItems.length" class="text-center py-16">
        <div class="relative w-52 h-52 mx-auto mb-6">
          <img src="~/assets/images/cart-empty.png" alt="Empty shopping cart" class="w-full h-full object-contain">
        </div>
        <h2 class="text-2xl font-bold text-gray-800">Your cart is empty</h2>
        <p class="text-gray-500 mt-2 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <NuxtLink to="/" class="px-6 py-3 bg-[#C42B78] text-white font-semibold rounded-lg shadow-md hover:bg-[#d81b36] transition-transform hover:scale-105">
          Continue Shopping
        </NuxtLink>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between pb-4 border-b">
              <div class="flex items-center">
                <input type="checkbox" v-model="selectAll" class="h-5 w-5 rounded border-gray-300 text-[#C42B78] focus:ring-[#C42B78]/50">
                <label for="select-all" class="ml-3 text-sm font-medium">
                  Select All ({{ cartStore.cartItems.length }} item{{ cartStore.cartItems.length !== 1 ? 's' : '' }})
                </label>
              </div>
              <button @click="removeSelectedItems" :disabled="!selectedItems.length" class="text-sm text-red-500 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed">
                Delete Selected
              </button>
            </div>
            
            <transition-group name="cart-item" tag="div" class="divide-y divide-gray-200">
              <CartItem
                v-for="item in cartStore.cartItems"
                :key="`${item.id}-${JSON.stringify(item.variant.size)}`"
                :item="item"
                :selected="isSelected(item)"
                @selected="toggleProductSelection"
                @save-for-later="saveItemForLater"
                class="cart-item py-4"
              />
            </transition-group>
          </div>
          
          <div v-if="savedForLaterItems.length" class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Saved for Later ({{ savedForLaterItems.length }})</h2>
            <div class="divide-y divide-gray-200">
                <div v-for="item in savedForLaterItems" :key="item.id" class="py-4 flex items-center gap-4">
                    <img :src="item.product.media[0]?.url" class="w-20 h-20 rounded-md object-cover">
                    <div class="flex-1">
                        <p class="font-semibold text-sm">{{ item.product.title }}</p>
                        <p class="text-gray-500 text-sm">{{ formatPrice(item.product.price) }}</p>
                    </div>
                    <button @click="moveToCart(item)" class="text-sm text-[#C42B78] hover:underline">Move to Cart</button>
                </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div class="space-y-3">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal ({{ selectedItems.length }} items)</span>
                <span class="font-medium text-gray-900">{{ formatPrice(totalPriceComputed) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span class="font-medium text-green-600">Free</span>
              </div>
              <div class="border-t pt-4 mt-4">
                <div class="flex justify-between text-gray-900 font-bold text-lg">
                  <span>Order Total</span>
                  <span>{{ formatPrice(totalPriceComputed) }}</span>
                </div>
              </div>
            </div>
            <button @click="goToCheckout" :disabled="!selectedItems.length" class="mt-6 w-full bg-[#C42B78] text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-[#d81b36] transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '~/stores/cart.store';
import CartItem from '~/components/product/CartItem.vue';
import type { CartItemInterface } from '~/models/interface/cart/cart.interface';
import { notify } from '@kyvg/vue3-notification';

// definePageMeta({ layout: 'main-layout' });

const router = useRouter();
const cartStore = useCartStore();

const selectedItems = ref<CartItemInterface[]>([]);
const savedForLaterItems = ref<CartItemInterface[]>([]);

// "Select All" logic
const selectAll = computed({
  get: () => cartStore.cartItems.length > 0 && selectedItems.value.length === cartStore.cartItems.length,
  set: (value) => {
    selectedItems.value = value ? [...cartStore.cartItems] : [];
  }
});

const isSelected = (item: CartItemInterface) => {
  return selectedItems.value.some(p => p.id === item.id);
};

const toggleProductSelection = (data: { item: CartItemInterface, selected: boolean }) => {
  const { item, selected } = data;
  const index = selectedItems.value.findIndex(p => p.id === item.id);
  
  if (selected && index === -1) {
    selectedItems.value.push({ ...item });
  } else if (!selected && index > -1) {
    selectedItems.value.splice(index, 1);
  }
};

const removeSelectedItems = () => {
    if(!confirm('Are you sure you want to remove the selected items?')) return;
    selectedItems.value.forEach(item => {
        cartStore.removeFromCart(item.id);
    });
    selectedItems.value = [];
    notify({ type: 'success', text: 'Selected items removed from cart.' });
};

const saveItemForLater = (item: CartItemInterface) => {
    savedForLaterItems.value.push(item);
    cartStore.removeFromCart(item.id);
    selectedItems.value = selectedItems.value.filter(p => p.id !== item.id);
    notify({ type: 'info', text: `${item.product.title} saved for later.` });
};

const moveToCart = (item: CartItemInterface) => {
    cartStore.addToCart(item.product, item.variant, item.quantity);
    savedForLaterItems.value = savedForLaterItems.value.filter(p => p.id !== item.id);
};

const totalPriceComputed = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + ((item.variant.price || item.product.price) * (item.quantity || 1)), 0);
});

const goToCheckout = () => {
  cartStore.checkout = [...selectedItems.value];
  router.push('/shipping/checkout');
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