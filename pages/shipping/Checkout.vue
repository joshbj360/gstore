<template>
  <header class="sticky top-0 z-10 bg-white shadow-sm">
    <div class="container mx-auto px-4 py-4 flex items-center">
      <button
        @click="navigateHome"
        class="flex items-center text-gray-700 hover:text-[#f02c56] transition-colors focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50 focus:ring-offset-2"
      >
        <Icon name="mdi:arrow-left" size="24" class="mr-2" />
        <span class="font-medium">Back to Home</span>
      </button>
    </div>
  </header>
  <div class="mt-4 mx-auto px-4 w-full max-w-[800px]" id="CheckoutPage" style="margin-top: 4rem;">
    <h1 class="text-2xl font-bold mb-6">Checkout</h1>
    <div class="md:flex gap-6 justify-between">
      <!-- Shipping Address -->
      <div class="md:w-3/5 space-y-4">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold mb-4">Shipping Address</h2>
          <div v-if="shippingStore.address" class="space-y-4">
            <NuxtLink
              to="/shipping/address"
              class="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              aria-label="Update shipping address"
            >
              <Icon name="mdi:plus" class="mr-2" /> Update Address
            </NuxtLink>
            <div class="border-t pt-4">
              <h3 class="font-medium mb-2">Delivery Address</h3>
              <ul class="text-sm space-y-2">
                <li><span class="font-semibold">Contact:</span> {{ shippingStore.address.name || 'N/A' }}</li>
                <li><span class="font-semibold">Address:</span> {{ shippingStore.address.address || 'N/A' }}</li>
                <li><span class="font-semibold">Local Govt Area:</span> {{ shippingStore.address.localGovernmentArea || 'N/A' }}</li>
                <li><span class="font-semibold">State:</span> {{ shippingStore.address.state || 'N/A' }}</li>
                <li><span class="font-semibold">Phone:</span> {{ shippingStore.address.phoneNumber || 'N/A' }}</li>
                <li><span class="font-semibold">Postal Code:</span> {{ shippingStore.address.postalCode || 'N/A' }}</li>
                <li><span class="font-semibold">Country:</span> {{ shippingStore.address.country || 'N/A' }}</li>
                <li><span class="font-semibold">Email:</span> {{ shippingStore.address.email || 'N/A' }}</li>
                <li><span class="font-semibold">City:</span> {{ shippingStore.address.city || 'N/A' }}</li>
              </ul>
            </div>
          </div>
          <NuxtLink
            v-else
            to="/address"
            class="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            aria-label="Add new shipping address"
          >
            <Icon name="mdi:plus" size="18" class="mr-2" /> Add New Address
          </NuxtLink>
          <p v-if="shippingStore.error" class="text-red-600 text-sm mt-2">{{ shippingStore.error }}</p>
        </div>
        <!-- Cart Items -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold mb-4">Your Items</h2>
          <div v-for="item in cartStore.checkout" :key="item.id" class="border-b py-4 last:border-b-0">
            <CheckoutItem :item="item" :show-welcome-deal="true" />
          </div>
          <p v-if="!cartStore.checkout.length" class="text-center text-gray-500">No items in checkout.</p>
        </div>
      </div>
      <!-- Order Summary -->
      <div class="md:w-2/5 mt-6 md:mt-0">
        <div class="bg-white rounded-xl shadow-sm p-6 sticky top-16">
          <h2 class="text-xl font-semibold mb-4">Order Summary</h2>
          <div class="space-y-4">
            <div class="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${{ (subtotal / 100).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div class="border-t pt-4 flex justify-between font-semibold">
              <span>Total</span>
              <span class="text-xl">${{ (total / 100).toFixed(2) }}</span>
            </div>
          </div>
          <form @submit.prevent="pay" class="mt-6" aria-label="Payment form">
            <div class="border border-gray-300 rounded-lg p-3" id="paystack-element"></div>
            <p class="text-red-600 text-sm mt-2 text-center" id="paystack-errors" role="alert" />
            <button
              :disabled="isProcessing || !shippingStore.address"
              type="submit"
              class="mt-6 w-full bg-gradient-to-r from-[#f02c56] to-[#FE630C] text-white text-xl font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50 focus:ring-offset-2"
              aria-label="Place order button"
            >
              <Icon v-if="isProcessing" name="eos-icons:loading" class="mr-2 animate-spin" />
              <span>{{ isProcessing ? 'Processing...' : 'Place Order' }}</span>
            </button>
          </form>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h3 class="text-lg font-semibold">Grandeur Guarantee</h3>
          <p class="text-sm mt-2">Your information and payment are secure with us.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Add PaystackPop type to the Window interface for TypeScript
declare global {
  interface Window {
    PaystackPop?: any;
  }
}
import MainLayout from '~/layouts/MainLayout.vue';
import CheckoutItem from '~/components/product/CheckoutItem.vue';
import { useCartStore } from '~/stores/cart.store';
import { useShippingStore } from '~/stores/shipping.store';
import { useSupabaseUser } from '#imports';
import { onBeforeMount, onMounted, watch, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRuntimeConfig } from '#imports';
import type { PaystackPop } from '@paystack/inline-js';
import type { CartInterface } from '~/models/interface/cart/cart.interface';

const cartStore = useCartStore();
const shippingStore = useShippingStore();
const user = useSupabaseUser();
const route = useRoute();
const router = useRouter();
const runtimeConfig = useRuntimeConfig();

const paystack = ref<PaystackPop | null>(null);
const total = ref(0);
const subtotal = ref(0);
const clientReference = ref<string | null>(null);
const isProcessing = ref(false);

// Fetch address on mount
onBeforeMount(async () => {
  if (!cartStore.checkout.length) {
    return router.push('/cart');
  }
  if (user.value) {
    await shippingStore.fetchAddress(user.value.id);
  }
});

// Calculate totals based on checkout items
const calculateTotals = () => {
  subtotal.value = cartStore.checkout.reduce((sum, item: CartInterface) => sum + (item.product.price * (item.quantity || 1)), 0);
  total.value = subtotal.value; // Add shipping or other adjustments if needed
};

// Redirect if not authenticated
watch(
  () => route.fullPath,
  (newPath) => {
    if (newPath === '/shipping/checkout' && !user.value) {
      router.push('/auth/login');
    }
  }
);

// Watch checkout items for total recalculation
watch(
  () => cartStore.checkout,
  () => {
    calculateTotals();
  },
  { immediate: true }
);

// Initialize on mount
onMounted(() => {
  if (total.value > 0) {
    paystackInit();
  }
});

const paystackInit = async () => {
  try {
    if (typeof window.PaystackPop === 'undefined') {
      throw new Error('PaystackPop is not loaded. Please include https://js.paystack.co/v2/inline.js in your project.');
    }
    paystack.value = new window.PaystackPop();
    if (!paystack.value) throw new Error('Paystack initialization failed');

    const res = await $fetch<{ reference: string }>('/api/paystack/transaction-initialize', {
      method: 'POST',
      body: { amount: total.value * 100, email: user.value?.email },
    });
    clientReference.value = res.reference;

    paystack.value.newTransaction({
      key: runtimeConfig.paystackPk,
      email: user.value?.email,
      amount: total.value * 100,
      reference: clientReference.value,
      callback: (response: { status: string; }) => {
        if (response.status === 'success') {
          paySuccess();
        } else {
          showError('Payment failed. Please try again.');
        }
      },
      onClose: () => {
        isProcessing.value = false;
        showError('Payment popup was closed.');
      },
    });
  } catch (error) {
    showError('Failed to initialize payment. Please try again.');
  }
};

const pay = () => {
  if (!shippingStore.address) {
    showError('Please add a shipping address');
    return;
  }
  if (paystack.value) {
    isProcessing.value = true;
    paystack.value.openIframe();
  } else {
    showError('Payment gateway not initialized.');
  }
};

const paySuccess = async () => {
  try {
    await createOrder(clientReference.value ?? '');
    cartStore.checkout = [];
    router.push('/success');
  } catch (error) {
    showError('Order confirmation failed. Please contact support.');
  } finally {
    isProcessing.value = false;
  }
};

const createOrder = async (reference: string) => {
  try {
    await useFetch('/api/prisma/create-order', {
      method: 'POST',
      body: {
        userId: user.value?.id,
        reference,
        name: shippingStore.address?.name,
        address: shippingStore.address?.address,
        localGovernmentArea: shippingStore.address?.localGovernmentArea,
        state: shippingStore.address?.state,
        phoneNumber: shippingStore.address?.phoneNumber,
        postalCode: shippingStore.address?.postalCode,
        country: shippingStore.address?.country,
        email: shippingStore.address?.email,
        city: shippingStore.address?.city,
        products: cartStore.checkout.map((item: CartInterface) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          selectedSizes: item.selectedSizes,
        })),
      },
    });
  } catch (error) {
    showError('Order creation failed. Please try again.');
  }
};

const showError = (errorMsg: string) => {
  const errorElement = document.querySelector('#paystack-errors');
  if (errorElement) {
    errorElement.textContent = errorMsg;
    setTimeout(() => {
      if (errorElement) errorElement.textContent = '';
    }, 4000);
  }
};

const navigateHome = () => {
  router.push('/');
};
</script>

<style scoped>
button:disabled {
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>