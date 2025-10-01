<template>
  <div>
    <!-- The Skeleton Loader is shown while the initial data is pending -->
    <CartSkeleton v-if="cartStore.isLoading" />
    
    <!-- The Error state is shown if the fetch fails -->
    <!-- <div v-else-if="error" class="text-center py-20">
        <h2 class="text-2xl font-bold text-red-500">Could not load your cart</h2>
        <p class="text-gray-500 mt-2">{{ error.message }}</p>
    </div> -->
    
    <!-- The real content is only rendered AFTER data has successfully arrived -->
    <div v-else id="ShoppingCartPage" class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm sticky top-0 z-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Empty Cart -->
        <div v-if="cartStore.cartItems.length === 0 && savedForLaterItems.length === 0" class="text-center py-16">
          <div class="relative w-52 h-52 mx-auto mb-6">
            <img src="~/assets/images/cart-empty.png" alt="Empty shopping cart" class="w-full h-full object-contain">
          </div>
          <h2 class="text-2xl font-bold text-gray-800">Your cart is empty</h2>
          <p class="text-gray-500 mt-2 mb-6">Looks like you haven't added anything yet.</p>
          <NuxtLink to="/" class="px-6 py-3 bg-[#f02c56] text-white font-semibold rounded-lg shadow-md hover:bg-[#d81b36] transition-transform hover:scale-105">
            Continue Shopping
          </NuxtLink>
        </div>

        <!-- Cart with Items -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div class="lg:col-span-2 space-y-6">
            <div v-if="cartStore.cartItems.length > 0" class="bg-white rounded-xl shadow-sm p-6">
              <div class="flex items-center justify-between pb-4 border-b">
                <div class="flex items-center">
                  <input type="checkbox" v-model="selectAll" class="h-5 w-5 rounded border-gray-300 text-[#f02c56] focus:ring-[#f02c56]/50">
                  <label for="select-all" class="ml-3 text-sm font-medium">
                    Select All ({{ cartStore.cartCount }} item{{ cartStore.cartCount !== 1 ? 's' : '' }})
                  </label>
                </div>
                <button @click="removeSelectedItems" :disabled="!selectedItems.length" class="text-sm text-red-500 hover:underline disabled:text-gray-400">
                  Delete Selected
                </button>
              </div>
              <transition-group name="cart-item" tag="div" class="divide-y divide-gray-200">
                <CartItem
                  v-for="item in cartStore.cartItems"
                  :key="item.id"
                  :item=" item"
                  :selected="isSelected(item)"
                  @selected="toggleProductSelection"
                  @save-for-later="saveItemForLater"
                  class="cart-item py-4"
                />
              </transition-group>
            </div>
            
            <!-- Saved for Later Section -->
            <div v-if="savedForLaterItems.length > 0" class="bg-white rounded-xl shadow-sm p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4">Saved for Later ({{ savedForLaterItems.length }})</h2>
              <div class="divide-y divide-gray-200">
                  <div v-for="item in savedForLaterItems" :key="item.id" class="py-4 flex items-center gap-4">
                      <img 
                      v-if="item.product.media && item.product.media.length"
                        :src="item.product?.media[0].url" 
                        class="w-20 h-20 rounded-md object-cover"
                      >
                      <div class="flex-1">
                          <p class="font-semibold text-sm">{{ item.product?.title }}</p>
                          <p class="text-gray-500 text-sm">{{ formatPrice(item.variant.price) }}</p>
                      </div>
                      <button @click="moveToCart(item)" class="text-sm text-[#f02c56] hover:underline">Move to Cart</button>
                  </div>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
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
              <button @click="goToCheckout" :disabled="!selectedItems.length" class="mt-6 w-full bg-[#f02c56] text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-[#d81b36] transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '~/stores/cart.store';
import CartItem from '~/components/product/CartItem.vue';
import CartSkeleton from '~/components/skeletons/CartSkeleton.vue';
import type { IProduct, ICartItem } from '~/models';
import { notify } from '@kyvg/vue3-notification';

definePageMeta({ layout: 'main-layout' });

const router = useRouter();
const cartStore = useCartStore();

let _product = ref<IProduct>({} as IProduct); // Temporary holder for fetched products
const selectedItems = ref<ICartItem[]>([]);
const savedForLaterItems = ref<ICartItem[]>([]); // This would typically be managed in its own store

// This is the core of the optimization. `useAsyncData` calls the store action
// to fetch and populate the cart BEFORE the page is rendered.
// const { pending, error } = await useAsyncData(
//     'cart-items',
//     () => cartStore.fetchCartItems(),
//     {
//         // We don't want this to run on the server if the user is a guest,
//         // as the cart only exists in their browser's localStorage.
//         server: useUserStore().isLoggedIn 
//     }
// );


// "Select All" logic
const selectAll = computed({
  get: () => cartStore.cartItems.length > 0 && selectedItems.value.length === cartStore.cartItems.length,
  set: (value) => {
    selectedItems.value = value ? [...cartStore.cartItems] : [];
  }
});

const isSelected = (item: ICartItem) => selectedItems.value.some(p => p.id === item.id);

const toggleProductSelection = (data: { item: ICartItem, selected: boolean }) => {
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
    selectedItems.value.forEach(item => cartStore.removeFromCart(item.id));
    selectedItems.value = [];
    notify({ type: 'success', text: 'Selected items removed.' });
};

const saveItemForLater = (item: ICartItem) => {
    savedForLaterItems.value.push(item);
    cartStore.removeFromCart(item.id);
    notify({ type: 'info', text: `${item.product?.title} saved for later.` });
};

const moveToCart = (item: ICartItem) => {
  if(item.product){
    cartStore.addToCart(item.variant.productId, item.variant, item.quantity, item.product);
    savedForLaterItems.value = savedForLaterItems.value.filter(p => p.id !== item.id);
  }
};

const totalPriceComputed = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + ((item.variant.price ) * item.quantity), 0);
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
