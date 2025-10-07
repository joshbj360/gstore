<template>
  <nav id="top-nav" class="fixed bg-white z-50 w-full border-b border-gray-200 h-16" role="navigation">
    <div class="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 h-full gap-3">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center" aria-label="Go to homepage">
        <img v-if="!isExtraSmallScreen" src="~/assets/images/grandeur-logo1.png" alt="Grandeur Logo" class="h-9 w-auto" />
        <img v-else src="~/assets/images/auraSmall.png" alt="Grandeur Logo" class="h-9 w-auto" />
      </NuxtLink>

      <!-- Search Bar -->
      <div v-click-outside="() => isSearchFocused = false" class="flex-1 max-w-lg relative">
        <div class="flex items-center bg-gray-100 p-1 rounded-full border-2 border-transparent focus-within:border-[#C42B78] transition-all">
          <input
            v-model="searchItem"
            type="text"
            class="w-full bg-transparent px-4 py-2 text-sm placeholder-gray-500 focus:outline-none"
            placeholder="Search products..."
            @focus="isSearchFocused = true"
          />
          <button type="button" class="px-3" @click="performSearch" aria-label="Search">
            <Icon name="mdi:magnify" size="20" class="text-gray-600" />
          </button>
        </div>
        <transition enter-active-class="transition-opacity duration-200 ease-out" leave-active-class="transition-opacity duration-200 ease-in" enter-from-class="opacity-0" leave-to-class="opacity-0">
          <div v-if="isSearchFocused && (searchResults.length || isSearching || searchItem)" class="absolute bg-white w-full mt-2 shadow-lg rounded-lg z-50 border max-h-96 overflow-y-auto">
            <!-- Search results content here -->
          </div>
        </transition>
      </div>

      <!-- Navigation Icons -->
      <div class="flex items-center gap-2">
        <!-- Cart Icon (Always Visible) -->
        <NuxtLink v-if="!isExtraSmallScreen" to="/buyer/cart" class="relative p-2 hover:bg-brand/10 rounded-lg transition-all duration-250" aria-label="View shopping cart">
          <Icon name="mdi:cart-outline" :size="isExtraSmallScreen ? '22' : '20'" class="text-gray-600 hover:text-brand-dark" />
          <span v-if="cartStore.cartCount > 0" class="cart-badge">
            {{ cartStore.cartCount }}
          </span>
          <!-- <span  class="ml-2 text-sm font-medium text-gray-600 hover:text-brand-dark">My Cart</span> -->
        </NuxtLink>

        <!-- Non-Logged-In User Actions -->
        <div v-if="!userStore.isLoggedIn" class="flex items-center gap-2">
          <NuxtLink to="/seller/profile/create-profile" class="bg-brand text-white rounded-lg text-sm font-medium hover:bg-[#d81b36] transition-all whitespace-nowrap flex items-center justify-center" :class="isExtraSmallScreen ? 'w-10 h-10' : 'px-4 py-2'">
            <Icon name="mdi:store-plus-outline" :size="isExtraSmallScreen ? '22' : '20'" />
            <span v-if="!isExtraSmallScreen" class="ml-2">Sell</span>
          </NuxtLink>
          <NuxtLink to="/auth/login" class="bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center" :class="isExtraSmallScreen ? 'w-10 h-10' : 'px-4 py-2'">
            <Icon name="mdi:login-variant" :size="isExtraSmallScreen ? '22' : '20'" />
            <span v-if="!isExtraSmallScreen" class="ml-2">Login</span>
          </NuxtLink>
          
        </div>

        <!-- Logged-In User Actions (Non-Seller) -->
        <div v-else-if="userStore.isLoggedIn && !userStore.isSeller" class="flex items-center gap-2">
          <NuxtLink to="/seller/profile/create-profile" class="bg-brand text-white rounded-lg text-sm font-medium hover:bg-[#d81b36] transition-all whitespace-nowrap flex items-center justify-center" :class="isExtraSmallScreen ? 'w-10 h-10' : 'px-4 py-2'">
            <Icon name="mdi:store-plus-outline" :size="isExtraSmallScreen ? '22' : '20'" />
            <span v-if="!isExtraSmallScreen" class="ml-2">Sell</span>
          </NuxtLink>
        
          <button @click="logout" class="bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center" :class="isExtraSmallScreen ? 'w-10 h-10' : 'px-4 py-2'">
            <Icon name="mdi:logout-variant" :size="isExtraSmallScreen ? '22' : '20'" />
            <span v-if="!isExtraSmallScreen" class="ml-2">Logout</span>
          </button>
            <NuxtLink to="/buyer/profile" class="bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center" :class="isExtraSmallScreen ? 'w-10 h-10' : 'px-4 py-2'">
            <img :src="userStore.userProfile?.avatar || `https://avatar.iran.liara.run/public/boy?username=${userStore.userProfile?.username}`" class="w-9 h-9 rounded-full" />
          </NuxtLink>
        </div>

        <!-- Logged-In Seller Actions -->
        <div v-else class="flex items-center gap-2">
          <NuxtLink to="/upload" class="hidden md:flex items-center text-sm font-medium text-gray-600 hover:text-brand-dark" aria-label="Upload product">
            <Icon name="mdi:plus-box-outline" size="22" />
            <span class="ml-2">Add a product</span>
          </NuxtLink>
          <div v-click-outside="() => showMenu = false" class="relative">
            <button @click="showMenu = !showMenu" class="p-1 rounded-full hover:bg-gray-100" aria-label="Toggle user menu">
              <img :src="userStore.userProfile?.avatar || `https://avatar.iran.liara.run/public/boy?username=${userStore.userProfile?.username}`" class="w-9 h-9 rounded-full" />
            </button>
            <transition enter-active-class="transition-all duration-200 ease-out" leave-active-class="transition-all duration-200 ease-in" enter-from-class="opacity-0 scale-95" leave-to-class="opacity-0 scale-95">
              <div v-if="showMenu" class="absolute bg-white rounded-lg py-2 w-56 shadow-lg border top-12 right-0 z-50">
                <div class="px-4 py-2 border-b">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ userStore.userProfile?.username || userStore.user?.email }}</p>
                  <p class="text-xs text-gray-500">{{ userStore.isSeller ? 'Seller Account' : 'Buyer Account' }}</p>
                </div>
                <div class="py-1">
                  <NuxtLink v-if="userStore.isSeller" to="/seller/Dashboard" @click="showMenu = false" class="menu-item">
                    <Icon name="mdi:view-dashboard-outline" size="20" class="mr-3" /> Dashboard
                  </NuxtLink>
                  <NuxtLink v-else to="/buyer/profile" @click="showMenu = false" class="menu-item">
                    <Icon name="mdi:account-circle-outline" size="20" class="mr-3" /> My Profile
                  </NuxtLink>
                  <NuxtLink to="/buyer/cart" @click="showMenu = false" class="menu-item">
                    <Icon name="mdi:cart-outline" size="20" class="mr-3" /> My Cart
                  </NuxtLink>
                </div>
                <button @click="logout" class="menu-item w-full text-left border-t mt-1 pt-2">
                  <Icon name="mdi:logout" size="20" class="mr-3" /> Log out
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '~/stores/user.store';
import { useCartStore } from '~/stores/cart.store';
import { useDebounceFn } from '@vueuse/core';
import type { IProduct } from '~/models';

// Custom directive to detect clicks outside an element
const vClickOutside = {
  beforeMount: (el: any, binding: any) => {
    el.clickOutsideEvent = (event: MouseEvent) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted: (el: any) => {
    document.removeEventListener('click', el.clickOutsideEvent);
  },
};

const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();

const showMenu = ref(false);
const searchItem = ref('');
const isSearching = ref(false);
const isSearchFocused = ref(false);
const searchResults = ref<IProduct[]>([]);
const isMobile = ref(false);
const isExtraSmallScreen = ref(false);

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 640;
  isExtraSmallScreen.value = window.innerWidth < 400;
};

const performSearch = useDebounceFn(async () => {
  if (!searchItem.value.trim()) {
    searchResults.value = [];
    isSearching.value = false;
    return;
  }
  isSearching.value = true;
  try {
    const { data } = await useFetch<IProduct[]>(`/api/prisma/search/search-by-name/${encodeURIComponent(searchItem.value)}`);
    searchResults.value = data.value || [];
  } catch (err) {
    console.error('Search error:', err);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}, 300);

const logout = async () => {
  await userStore.logout();
  showMenu.value = false;
  await router.push('/');
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price / 100);
};

onMounted(async () => {
  // if (userStore.isLoggedIn) {
  //   await userStore.fetchUserAndProfile();
  //   await cartStore.fetchCartItems(); // Fetch cart items for logged-in users
  // }
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});

watch(searchItem, performSearch);
</script>

<style scoped>
.cart-badge {
  @apply absolute -top-1 -right-1 bg-brand text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white;
}
.menu-item {
  @apply flex items-center py-2 px-4 text-sm text-gray-700 hover:bg-gray-100;
}
</style>