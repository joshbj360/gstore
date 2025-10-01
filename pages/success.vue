<template>
  <MainLayout>
    <div id="SuccessPage" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center flex flex-col items-center">
        <!-- Success Icon -->
        <div class="mb-6">
            <Icon name="mdi:check-circle-outline" class="text-green-500 h-20 w-20" />
        </div>

        <!-- Main Message -->
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900">Thank You for Your Order!</h1>
        <p class="text-gray-600 mt-3 max-w-lg">
            Your order has been placed successfully. A confirmation email with your order details has been sent to you.
        </p>

        <!-- Order Summary (Optional but recommended) -->
        <div class="mt-8 border-t border-b py-6 w-full max-w-md">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">What's Next?</h2>
            <ul class="text-left space-y-3 text-sm text-gray-500">
                <li class="flex items-start">
                    <Icon name="mdi:email-fast-outline" class="mr-3 mt-1 text-gray-400 shrink-0" size="18"/>
                    <span>You'll receive an email confirmation shortly.</span>
                </li>
                <li class="flex items-start">
                    <Icon name="mdi:package-variant-closed-check" class="mr-3 mt-1 text-gray-400 shrink-0" size="18"/>
                    <span>We'll notify you again once your order has shipped.</span>
                </li>
                <li class="flex items-start">
                    <Icon name="mdi:account-clock-outline" class="mr-3 mt-1 text-gray-400 shrink-0" size="18"/>
                    <span>You can view your order history in your profile at any time.</span>
                </li>
            </ul>
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4">
            <NuxtLink 
              to="/" 
              class="px-6 py-3 bg-[#f02c56] text-white font-semibold rounded-lg shadow-md hover:bg-[#d81b36] transition-transform hover:scale-105"
            >
              Continue Shopping
            </NuxtLink>
            <NuxtLink 
              to="/buyer/profile" 
              class="px-6 py-3 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              View My Orders
            </NuxtLink>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '~/layouts/MainLayout.vue';
import { useCartStore } from '~/stores/cart.store';
import { onMounted } from 'vue';

const cartStore = useCartStore();

// This ensures that if the checkout list is empty (e.g., user refreshes the success page),
// the cart is also cleared of the purchased items.
onMounted(() => {
    if(cartStore.checkout.length > 0) {
        cartStore.clearPurchasedItems();
    }
});
</script>
