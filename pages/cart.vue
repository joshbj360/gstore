<template>
  <div id="ShoppingCartPage" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <header class="sticky top-0 z-10 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center">
        <button
          @click="navigateHome"
          class="flex items-center text-gray-700 hover:text-[#f02c56] transition-colors"
        >
          <Icon name="mdi:arrow-left" size="24" class="mr-2" />
          <span class="font-medium">Back to Home</span>
        </button>
      </div>
    </header>

    <!-- Empty Cart -->
    <div v-if="!cartStore.cartItems.length" class="flex flex-col items-center justify-center min-h-[60vh]">
      <div class="text-center max-w-md">
        <div class="relative w-64 h-64 mx-auto mb-8">
          <img
            src="~/assets/images/cart-empty.png"
            alt="Empty shopping cart"
            class="w-full h-full object-contain animate-bounce-slow"
            loading="lazy"
          >
          <div class="absolute inset-0 bg-gradient-to-br from-pink-100/20 to-red-100/20 rounded-full blur-xl -z-10"></div>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-3">Your cart feels lonely</h2>
        <p class="text-gray-600 mb-6">
          {{ !user ? 'Sign in to see your saved items or start shopping now!' : 'Let\'s find something special for you!' }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink
            v-if="!user"
            to="/auth"
            class="px-6 py-3 bg-gradient-to-r from-[#f02c56] to-[#df4949] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:ring-offset-2"
          >
            Sign In
          </NuxtLink>
          <NuxtLink
            to="/"
            class="px-6 py-3 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Continue Shopping
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Cart with Items -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column (Cart Items + Product Details) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Cart Items Section -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-gray-900">
              Shopping Cart <span class="text-gray-500 font-normal">({{ cartStore.cartItems.length }} item{{ cartStore.cartItems.length !== 1 ? 's' : '' }})</span>
            </h1>
            <button
              v-if="selectedItems.length > 0"
              @click="selectedItems = []"
              class="text-sm text-[#f02c56] hover:underline"
            >
              Deselect all
            </button>
          </div>

          <div v-if="showWelcomeDeal" class="mb-6">
            <div class="bg-gradient-to-r from-pink-50 to-red-50 border-l-4 border-[#f02c56] p-4 rounded-r-lg">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-[#f02c56]" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-gray-700">
                    <span class="font-semibold text-[#f02c56]">Welcome Deal:</span> Applies to 1 item only
                  </p>
                </div>
              </div>
            </div>
          </div>

          <transition-group name="cart-item" tag="div" class="space-y-4">
            <CartItem
              v-for="item in cartStore.cartItems"
              :key="`${item.id}-${JSON.stringify(item.selectedSizes)}`"
              :item="item"
              :selected="isSelected(item)"
              @selected="toggleProductSelection(item)"
              @view-details="showProductDetails(item.product)"
              class="cart-item cursor-pointer hover:bg-gray-50 transition-colors"
            />
          </transition-group>
        </div>

        <!-- Product Details Modal/Overlay -->
        <div v-if="selectedProduct" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background overlay -->
            <div class="fixed inset-0 transition-opacity" aria-hidden="true">
              <div class="absolute inset-0 bg-gray-500 opacity-75" @click="selectedProduct = null"></div>
            </div>

            <!-- Modal content -->
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <!-- Close button -->
                  <button
                    @click="selectedProduct = null"
                    class="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                  >
                    <Icon name="mdi:close" size="24" />
                  </button>

                  <!-- Product image -->
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div class="relative h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          :src="selectedProduct.media[0]?.url || '/placeholder-image.jpg'"
                          :alt="selectedProduct.title || 'Product image'"
                          class="w-full h-full object-contain"
                          loading="lazy"
                        >
                      </div>

                      <!-- Product info -->
                      <div>
                        <h3 class="text-lg leading-6 font-medium text-gray-900">
                          {{ selectedProduct.title || selectedProduct.title }}
                        </h3>
                        <div class="mt-2">
                          <p v-html="selectedProduct.description || 'No description available'" class="text-sm text-gray-500">
                          </p>
                        </div>

                        <div class="mt-4">
                          <p class="text-2xl font-semibold text-[#f02c56]">
                            {{ formatPrice(selectedProduct.price) }}
                          </p>
                        </div>

                        <!-- Additional details -->
                        <div class="mt-6 space-y-3">
                          <div v-if="selectedProduct.category">
                            <span class="text-sm font-medium text-gray-900">Category:</span>
                            <span class="text-sm text-gray-500 ml-2">{{ selectedProduct.category.name }}</span>
                          </div>

                          <div v-if="selectedProduct.brand">
                            <span class="text-sm font-medium text-gray-900">Brand:</span>
                            <span class="text-sm text-gray-500 ml-2">{{ selectedProduct.brand }}</span>
                          </div>

                          <div v-if="selectedProduct.rating">
                            <div class="flex items-center">
                              <span class="text-sm font-medium text-gray-900">Rating:</span>
                              <div class="flex items-center ml-2">
                                <Icon
                                  v-for="star in 5"
                                  :key="star"
                                  :name="star <= selectedProduct.rating ? 'mdi:star' : 'mdi:star-outline'"
                                  class="text-yellow-400 w-4 h-4"
                                />
                                <span class="text-sm text-gray-500 ml-1">({{ selectedProduct.rating }}/5)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Action buttons -->
                        <div class="mt-6 flex space-x-3">
                          <button
                            @click="addToCartFromDetails"
                            class="flex-1 bg-gradient-to-r from-[#f02c56] to-[#df4949] text-white py-2 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
                          >
                            Add to Cart
                          </button>
                          <button
                            @click="goToProductPage"
                            class="flex-1 border border-gray-300 bg-white text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors"
                          >
                            View Full Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Help Section -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">Need help with your order?</h3>
            <button class="text-[#f02c56] hover:underline font-medium">Contact Support</button>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-6 sticky top-6">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-600">Subtotal</span>
              <span class="font-medium">{{ formatPrice(totalPriceComputed) }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600">Shipping</span>
              <span class="font-medium text-green-600">Free</span>
            </div>

            <div class="border-t border-gray-200 pt-4 mt-4">
              <div class="flex justify-between">
                <span class="text-lg font-semibold">Total</span>
                <span class="text-xl font-bold">{{ formatPrice(totalPriceComputed) }}</span>
              </div>
            </div>
          </div>

          <button
            @click="goToCheckout"
            :disabled="!selectedItems.length"
            class="mt-6 w-full bg-gradient-to-r from-[#f02c56] to-[#df4949] text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            Checkout ({{ selectedItems.length || cartStore.cartItems.length }} item{{ (selectedItems.length || cartStore.cartItems.length) !== 1 ? 's' : '' }})
          </button>

          <div class="mt-6 pt-6 border-t border-gray-200">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">We accept</h3>
            <div class="flex flex-wrap gap-3">
              <img
                v-for="card in paymentMethods"
                :key="card.name"
                :src="card.image"
                :alt="`${card.name} logo`"
                class="h-8 object-contain"
                loading="lazy"
                width="48"
                height="32"
              >
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center">
            <svg class="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 class="font-medium text-gray-900">Secure checkout</h3>
              <p class="text-sm text-gray-500">Your payment information is processed securely</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import MainLayout from '~/layouts/MainLayout.vue';
import CartItem from '~/components/product/CartItem.vue';
import type { ProductInterface} from '~/models/interface/products/product.interface';
import { useSupabaseUser } from '#imports';
import { useCartStore } from '~/stores/cart.store';
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { definePageMeta } from '#imports';
import type { CartInterface } from '~/models/interface/cart/cart.interface';
import type { LayoutKey } from '#build/types/layouts';

// Initialize stores and router
const router = useRouter();
const user = useSupabaseUser();
const cartStore = useCartStore();

// Reactive state
const showWelcomeDeal = ref(true);
const selectedItems = ref<CartInterface[]>([]);
const selectedProduct = ref<ProductInterface | null>(null);

// Payment methods data (static)
const paymentMethods = ref([
  { name: 'Visa', image: 'visa.png' },
  { name: 'Mastercard', image: 'mastercard.png' },
  { name: 'PayPal', image: 'paypal.png' },
  { name: 'Apple Pay', image: 'applepay.png' },
]);

// Computed properties
const totalPriceComputed = computed(() => {
  const items = selectedItems.value.length > 0 ? selectedItems.value : cartStore.cartItems;
  return items.reduce((sum, item) => sum + (item.product.price * (item.quantity || 1)), 0) / 100;
});

// Methods
const isSelected = (item: CartInterface) => {
  return selectedItems.value.some((p) => p.id === item.id && JSON.stringify(p.selectedSizes?.sort()) === JSON.stringify(item.selectedSizes?.sort()));
};

const toggleProductSelection = (item: CartInterface) => {
  const index = selectedItems.value.findIndex((p) => p.id === item.id && JSON.stringify(p.selectedSizes?.sort()) === JSON.stringify(item.selectedSizes?.sort()));
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push({ ...item });
  }
};

const goToCheckout = () => {
  cartStore.checkout = selectedItems.value.length > 0 ? selectedItems.value : cartStore.cartItems;
  router.push('/shipping/checkout');
};

const focusAfterTransition = () => {
  nextTick(() => {
    const element = document.querySelector('a[href="/auth"]') || document.querySelector('a[href="/"]');
    (element as HTMLElement | null)?.focus();
  });
};

const navigateHome = () => {
  router.push('/');
};

const showProductDetails = (product: ProductInterface) => {
  selectedProduct.value = product;
};

const addToCartFromDetails = () => {
  if (selectedProduct.value) {
    cartStore.addToCart(selectedProduct.value);
    selectedProduct.value = null;
  }
};

const goToProductPage = () => {
  if (selectedProduct.value) {
    router.push(`/product/${selectedProduct.value.id}`);
  }
};

definePageMeta({
  layout: 'main' as LayoutKey,
  key: (route) => route.fullPath, // Cache per route
});

const { data: initialCart } = await useAsyncData(
  'cartItems',
  async () => {
    // Fetch cart items from Supabase
    if (!cartStore.cartItems.length) {
      await cartStore.fetchCartItems();
    }
    return cartStore.cartItems;
  },
  {
    server: true,
    default: () => [], // Fallback for hydration
    dedupe: 'defer', // Prevent duplicate requests
    // maxAge: 300, // Optional: expire cache after 5 minutes
  }
);

// Sync initial data with store on mount
onMounted(() => {
  if (initialCart.value && initialCart.value.length > 0) {
    cartStore.cartItems = initialCart.value.map(item => ({
      ...item,
      quantity: item.quantity && item.quantity > 0 ? item.quantity : 1, // Validate quantity
      selectedSizes: item.selectedSizes || [],
    }));
  }
  if (!cartStore.cartItems.length && !user.value) {
    focusAfterTransition();
  }
});

// Sync store actions
cartStore.$onAction(({ name, args, after }) => {
  after(() => {
    // Ensure state consistency
    cartStore.cartItems = cartStore.cartItems.map(item => ({
      ...item,
      quantity: item.quantity && item.quantity > 0 ? item.quantity : 1, // Validate quantity
    }));
  });
});

// Price formatting utility
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol',
  }).format(price);
};
</script>

<style scoped>
/* Tailwind handles most styling; keep minimal custom CSS for animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Custom animation for empty cart image */
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

/* Cart item transition */
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.3s ease;
}

.cart-item-enter-from,
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Modal transition */
.transform {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
</style>