<template>
  <HomeLayout>
    <!-- Default Slot: Main Checkout Steps -->
    <div>
      <div class="p-4 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900  top-0 z-10 lg:hidden">
        <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100 text-center">Secure Checkout</h1>
      </div>

      <CheckoutSkeleton v-if="pending" />

      <div v-else-if="error" class="text-center py-20">
        <p class="text-brand-dark dark:text-brand-light">Could not load checkout data.</p>
      </div>
      
      <div v-else-if="!cartStore.checkout.length && !isOrderComplete" class="text-center py-16">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-neutral-200">Your checkout is empty.</h2>
          <p class="text-gray-500 dark:text-neutral-400 mt-2">Redirecting you to the cart page...</p>
      </div>

      <div v-else class="space-y-6 p-4">
        <!-- Step 1: Shipping Information -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-neutral-800">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100"><span class="checkout-step">1</span> Shipping Information</h2>
            <NuxtLink to="/shipping/address" class="text-sm font-medium text-brand hover:underline">
              {{ shippingStore.address ? 'Change' : 'Add Address' }}
            </NuxtLink>
          </div>
          <div v-if="shippingStore.address" class="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700 text-sm text-gray-600 dark:text-neutral-300 space-y-1">
            <p><strong>{{ shippingStore.address.name }}</strong></p>
            <p>{{ shippingStore.address.address }}, {{ shippingStore.address.county }}</p>
          </div>
           <div v-else class="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700 text-sm text-gray-500 dark:text-neutral-400">
            Please add a shipping address to continue.
          </div>
        </div>

        <!-- Step 2: Payment Method -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-neutral-800">
          <h2 class="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100"><span class="checkout-step">2</span> Payment Method</h2>
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700 space-y-3">
            <label v-for="method in paymentMethods" :key="method.id" class="flex items-center p-3 border border-gray-300 dark:border-neutral-700 rounded-lg cursor-pointer transition-all" :class="{'border-[#f02c56] bg-brand/5 ring-2 ring-[#f02c56]/50': paymentMethod === method.id}">
              <input type="radio" :value="method.id" v-model="paymentMethod" class="h-4 w-4 text-brand focus:ring-[#f02c56]/50 border-gray-300 dark:border-neutral-600">
              <span class="ml-3 text-sm font-medium text-gray-800 dark:text-neutral-200">{{ method.label }}</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Padding for mobile sticky footer -->
      <div class="h-28 lg:hidden"></div>
    </div>

    <!-- Right Sidebar Slot: Desktop Order Summary -->
    <template #right-sidebar>
      <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 sticky top-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-neutral-100 p-6 border-b border-gray-200 dark:border-neutral-800">Review Order</h2>
        <div class="p-6 max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-neutral-800">
          <CheckoutItem v-for="item in cartStore.checkout" :key="item.id" :item="item" />
        </div>
        <div class="p-6 border-t border-gray-200 dark:border-neutral-800 space-y-3">
          <div class="flex justify-between text-sm text-gray-600 dark:text-neutral-300">
            <span>Subtotal</span>
            <span class="font-medium text-gray-900 dark:text-neutral-100">{{ formatPrice(total) }}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-600 dark:text-neutral-300">
            <span>Shipping</span>
            <span class="font-medium text-green-600 dark:text-green-400">Free</span>
          </div>
          <div class="border-t border-gray-200 dark:border-neutral-700 pt-4 mt-4">
            <div class="flex justify-between text-gray-900 dark:text-neutral-100 font-bold text-lg">
              <span>Total</span>
              <span>{{ formatPrice(total) }}</span>
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 dark:border-neutral-800">
          <button :disabled="!canPlaceOrder || isProcessing" @click="processOrder" class="w-full bg-brand text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-brand-light transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed">
            <Icon v-if="isProcessing" name="eos-icons:loading" class="mr-2" />
            <span v-else>{{ paymentMethod === 'payondelivery' ? 'Confirm Order' : 'Proceed to Payment' }}</span>
          </button>
        </div>
      </div>
    </template>

    <!-- Left sidebar is empty for a focused checkout -->
    <template #left-sidebar></template>
  </HomeLayout>

  <!-- Mobile-Only Sticky Footer -->
  <div class="lg:hidden fixed bottom-14 left-0 right-0 z-10 p-4 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 shadow-lg-top">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-600 dark:text-neutral-400">Total</span>
        <span class="font-bold text-lg text-gray-900 dark:text-neutral-100">{{ formatPrice(total) }}</span>
      </div>
      <button :disabled="!canPlaceOrder || isProcessing" @click="processOrder" class="w-full bg-brand text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-70">
        <Icon v-if="isProcessing" name="eos-icons:loading" class="mr-2" />
        <span v-else>{{ paymentMethod === 'payondelivery' ? 'Confirm Order' : 'Confirm Order' }}</span>
      </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {  useCartStore, useShippingStore, useUserStore} from '~/stores';
import { useApiService } from '~/services/api/apiService';
import CheckoutItem from '~/components/product/CheckoutItem.vue';
import CheckoutSkeleton from '~/components/skeletons/CheckoutSkeleton.vue';
import HomeLayout from '~/layouts/HomeLayout.vue';
import type { ICartItem } from '~/models';
import { notify } from '@kyvg/vue3-notification';

definePageMeta({ layout: false }); // We use HomeLayout directly

const cartStore = useCartStore();
const shippingStore = useShippingStore();
const userStore = useUserStore();
const apiService = useApiService();
const router = useRouter();
useLayoutData(); // Call this to populate the layout's sidebars

const isProcessing = ref(false);
const isOrderComplete = ref(false);
const paymentMethod = ref('paynow');
const paymentMethods = [
    { id: 'paynow', label: 'Pay with Card / Bank Transfer' },
    { id: 'payondelivery', label: 'Pay on Delivery' }
];

const total = computed(() => {
  return cartStore.checkout.reduce((sum, item: ICartItem) => sum + ((item.variant.price || item.product.price) * item.quantity), 0);
});

const canPlaceOrder = computed(() => shippingStore.address && cartStore.checkout.length > 0);

// Use useLazyAsyncData to fetch the address, this allows the skeleton to work
const { pending, error } = await useLazyAsyncData('shipping-address', async () => {
    if (!userStore.isLoggedIn) {
        if (process.server) await navigateTo('/auth/login');
        return null;
    }
    if (cartStore.checkout.length === 0) {
        if (process.client) router.push('/buyer/cart');
        return null;
    }
    return shippingStore.fetchAddress();
});

const processOrder = async () => {
    if (!canPlaceOrder.value) {
        notify({ type: 'warn', text: 'Please add a shipping address to continue.' });
        return;
    }
    isProcessing.value = true;
    try {
        const orderPayload = {
            shippingAddress: shippingStore.address,
            checkoutItems: cartStore.checkout,
            totalAmount: total.value,
        };

        if (paymentMethod.value === 'paynow') {
            const res = await apiService.initializePayment({ amount: total.value});
            await apiService.createOrder({ ...orderPayload, paymentReference: res.reference, paymentMethod: 'paystack' });
            window.location.href = res.authorization_url;
        } else {
            await apiService.createOrder({ ...orderPayload, paymentReference: `cod_${Date.now()}`, paymentMethod: 'cod' });
            isOrderComplete.value = true;
            cartStore.clearPurchasedItems();
            router.push('/success');
        }
    } catch (error: any) {
        notify({ type: 'error', text: error.data?.message || 'Could not process your order.' });
    } finally {
        isProcessing.value = false;
    }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price / 100);
};
</script>

<style scoped>
.checkout-step {
    @apply bg-brand text-white rounded-full h-6 w-6 text-sm flex items-center justify-center;
}
.shadow-lg-top {
  box-shadow: 0 -4px 10px -1px rgba(0, 0, 0, 0.1), 0 -2px 6px -2px rgba(0, 0, 0, 0.1);
}
.dark .shadow-lg-top {
  box-shadow: 0 -4px 10px -1px rgba(0, 0, 0, 0.5), 0 -2px 6px -2px rgba(0, 0, 0, 0.4);
}
</style>