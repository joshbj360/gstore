<template>
  <div class="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg z-40">
    <div class="flex justify-around items-center h-full">
      <NuxtLink to="/" class="nav-item">
        <Icon name="mdi:home-outline" size="24" />
        <span class="text-xs mt-1">Home</span>
      </NuxtLink>

      <NuxtLink to="/discover" class="nav-item">
        <Icon name="mdi:compass-outline" size="24" />
        <span class="text-xs mt-1">Discover</span>
      </NuxtLink>

      <NuxtLink v-if="userStore.isLoggedIn && userStore.isSeller" to="/upload/quick" class="transform -translate-y-4">
        <div class="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
          <Icon name="mdi:plus" size="32" />
        </div>
      </NuxtLink>

      <NuxtLink to="/buyer/cart" class="relative nav-item">
        <Icon name="mdi:cart-outline" size="24" />
        <span class="text-xs mt-1">Cart</span>
        <span v-if="cartStore.cartCount" class="absolute -top-1 right-1.5 bg-brand text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
          {{ cartStore.cartCount }}
        </span>
      </NuxtLink>

      <NuxtLink v-if="userStore.isLoggedIn" to="/buyer/profile" class="nav-item">
        <Icon name="mdi:account-outline" size="24" />
        <span class="text-xs mt-1">Profile</span>
      </NuxtLink>
       <NuxtLink v-else to="/auth/login" class="nav-item">
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
</script>

<style scoped>
.nav-item {
    @apply flex flex-col items-center justify-center text-gray-600 hover:text-brand-dark w-1/5;
}
</style>