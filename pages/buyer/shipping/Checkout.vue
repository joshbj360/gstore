<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <Icon name="mdi:arrow-left" size="20" />
            <span class="font-semibold text-sm">Back to Store</span>
        </NuxtLink>
        <h1 class="text-xl font-bold text-gray-900">Secure Checkout</h1>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div v-if="!cartStore.checkout.length" class="text-center py-16">
            <h2 class="text-2xl font-bold">Your cart is empty.</h2>
            <p class="text-gray-500 mt-2">Redirecting you to the cart page...</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <!-- Left Column: Checkout Steps -->
            <div class="space-y-6">
                <!-- Step 1: Shipping Information -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-semibold flex items-center gap-2"><span class="bg-[#f02c56] text-white rounded-full h-6 w-6 text-sm flex items-center justify-center">1</span> Shipping Information</h2>
                        <NuxtLink to="/buyer/shipping/address" class="text-sm font-medium text-[#f02c56] hover:underline">
                            {{ shippingStore.address ? 'Change' : 'Add Address' }}
                        </NuxtLink>
                    </div>
                    <div v-if="shippingStore.address" class="mt-4 pt-4 border-t text-sm text-gray-600 space-y-1">
                        <p><strong>{{ shippingStore.address.name }}</strong></p>
                        <p>{{ shippingStore.address.address }}, {{ shippingStore.address.city }}</p>
                        <p>{{ shippingStore.address.state }}, {{ shippingStore.address.country }}</p>
                        <p>{{ shippingStore.address.phone }}</p>
                    </div>
                     <div v-else class="mt-4 pt-4 border-t text-sm text-gray-500">
                        Please add a shipping address to continue.
                    </div>
                </div>

                <!-- Step 2: Payment Method -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-semibold flex items-center gap-2"><span class="bg-[#f02c56] text-white rounded-full h-6 w-6 text-sm flex items-center justify-center">2</span> Payment Method</h2>
                    <div class="mt-4 pt-4 border-t space-y-3">
                        <label v-for="method in paymentMethods" :key="method.id" class="flex items-center p-3 border rounded-lg cursor-pointer transition-all" :class="{'border-[#f02c56] bg-[#f02c56]/5 ring-2 ring-[#f02c56]/50': paymentMethod === method.id}">
                            <input type="radio" :value="method.id" v-model="paymentMethod" class="h-4 w-4 text-[#f02c56] focus:ring-[#f02c56]/50 border-gray-300">
                            <span class="ml-3 text-sm font-medium">{{ method.label }}</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Right Column: Order Summary -->
            <div class="sticky top-24">
                <div class="bg-white rounded-xl shadow-sm">
                    <h2 class="text-lg font-semibold p-6 border-b">Review Order</h2>
                    <div class="p-6 max-h-64 overflow-y-auto divide-y">
                        <CheckoutItem v-for="item in cartStore.checkout" :key="item.id" :item="item" />
                    </div>
                    <div class="p-6 border-t space-y-3">
                        <div class="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span class="font-medium text-gray-900">{{ formatPrice(total) }}</span>
                        </div>
                        <div class="flex justify-between text-sm text-gray-600">
                            <span>Shipping</span>
                            <span class="font-medium text-green-600">Free</span>
                        </div>
                        <div class="border-t pt-4 mt-4">
                            <div class="flex justify-between text-gray-900 font-bold text-lg">
                                <span>Total</span>
                                <span>{{ formatPrice(total) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button :disabled="!canPlaceOrder" @click="processOrder" class="mt-6 w-full bg-[#f02c56] text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-[#d81b36] transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed">
                    <span v-if="isProcessing">Processing...</span>
                    <span v-else>Place Order</span>
                </button>
            </div>
        </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore, useUserStore } from '~/stores';
import { useShippingStore } from '@/stores/shipping.store'
import CheckoutItem from '~/components/product/CheckoutItem.vue';
import type { CartItemInterface } from '~/models/interface/cart/cart.interface';
import { notify } from '@kyvg/vue3-notification';

const cartStore = useCartStore();
const shippingStore = useShippingStore();
const userStore = useUserStore();
const router = useRouter();

const isProcessing = ref(false);
const paymentMethod = ref('paynow');
const paymentMethods = [
    { id: 'paynow', label: 'Pay with Card / Bank Transfer' },
    { id: 'payondelivery', label: 'Pay on Delivery' }
];

const total = computed(() => {
  return cartStore.checkout.reduce((sum, item: CartItemInterface) => sum + ((item.variant.price || item.product.price) * (item.quantity || 1)), 0);
});

const canPlaceOrder = computed(() => {
    return shippingStore.address && !isProcessing.value;
});

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.push('/auth/login');
    return;
  }
  if (cartStore.checkout.length === 0) {
    router.push('/buyer/cart');
    return;
  }
  if (!shippingStore.address) {
      await shippingStore.fetchAddress(userStore.user!.id);
  }
});

const processOrder = async () => {
    isProcessing.value = true;
    try {
        // This is where you would integrate your payment logic (e.g., Paystack)
        // or create the order directly for "Pay on Delivery"
        console.log(`Processing order with method: ${paymentMethod.value}`);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        notify({ type: 'success', text: 'Order placed successfully!' });
        cartStore.checkout = []; // Clear the checkout items
        router.push('/success'); // Redirect to a success page

    } catch (error) {
        notify({ type: 'error', text: 'Failed to place order. Please try again.' });
    } finally {
        isProcessing.value = false;
    }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price / 100);
};

const navigateHome = () => router.push('/');
</script>