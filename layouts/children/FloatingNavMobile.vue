<template>
  <div class="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg z-40">
    <div class="flex justify-around items-center h-full">
      <NuxtLink to="/" class="flex flex-col items-center justify-center text-gray-600 hover:text-[#f02c56]">
        <Icon name="mdi:home-outline" size="24" />
        <span class="text-xs mt-1">Home</span>
      </NuxtLink>

      <button @click="openChat" class="flex flex-col items-center justify-center text-gray-600 hover:text-[#f02c56]">
        <Icon name="mdi:chat-processing-outline" size="24" />
        <span class="text-xs mt-1">AI Chat</span>
      </button>

      <NuxtLink to="/cart" class="relative flex flex-col items-center justify-center text-gray-600 hover:text-[#f02c56]">
        <Icon name="mdi:cart-outline" size="24" />
        <span class="text-xs mt-1">Cart</span>
        <span v-if="cartStore.cartCount" class="absolute -top-1 right-1.5 bg-[#f02c56] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
          {{ cartStore.cartCount }}
        </span>
      </NuxtLink>

      <NuxtLink v-if="userStore.isLoggedIn && userStore.isSeller" to="/seller/dashboard" class="flex flex-col items-center justify-center text-gray-600 hover:text-[#f02c56]">
        <Icon name="mdi:view-dashboard-outline" size="24" />
        <span class="text-xs mt-1">Dashboard</span>
      </NuxtLink>
      <NuxtLink v-else-if="userStore.isLoggedIn && !userStore.isSeller" to="/buyer/profile" class="flex flex-col items-center justify-center text-gray-600 hover:text-[#f02c56]">
        <Icon name="mdi:account-outline" size="24" />
        <span class="text-xs mt-1">Profile</span>
      </NuxtLink>
       <NuxtLink v-else to="/auth/login" class="flex flex-col items-center justify-center text-gray-600 hover:text-[#f02c56]">
        <Icon name="mdi:account-outline" size="24" />
        <span class="text-xs mt-1">Login</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart.store';
import { useUserStore } from '~/stores/user.store';

const cartStore = useCartStore();
const userStore = useUserStore();

const emit = defineEmits(['open-chat']);

const openChat = () => {
    emit('open-chat');
}
</script>