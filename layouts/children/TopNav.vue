<template>
  <nav id="top-nav" class="fixed bg-white z-50 w-full border-b border-gray-200 h-16" role="navigation">
    <div class="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-full gap-4">
      
      <!-- Logo: Conditionally hidden on mobile during search -->
      <div 
        class="flex-shrink-0 transition-all duration-300"
        :class="{ 'hidden sm:flex': isMobile && isSearchFocused }"
      >
        <NuxtLink to="/" class="flex items-center" aria-label="Go to homepage">
          <img src="~/assets/images/grandeur-logo.png" alt="Grandeur Logo" class="h-9 w-auto" />
        </NuxtLink>
      </div>

      <!-- Search Bar: Expands on mobile when focused -->
      <div 
        v-click-outside="() => isSearchFocused = false" 
        class="relative transition-all duration-300 ease-in-out"
        :class="isMobile && isSearchFocused ? 'flex-1' : 'flex-1 max-w-lg mx-4'"
      >
        <div class="flex items-center bg-gray-100 p-1 rounded-full border-2 border-transparent focus-within:border-[#f02c56] transition-all">
          <input
            v-model="searchItem"
            type="text"
            class="w-full bg-transparent px-4 py-2 text-sm placeholder-gray-500 focus:outline-none"
            placeholder="Search for anything..."
            @focus="isSearchFocused = true"
          />
          <button type="button" class="px-3" @click="performSearch" aria-label="Search">
            <Icon name="mdi:magnify" size="20" class="text-gray-600" />
          </button>
        </div>
        
        <transition
          enter-active-class="transition-opacity duration-200 ease-out"
          leave-active-class="transition-opacity duration-200 ease-in"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div v-if="isSearchFocused && (searchResults.length || isSearching || searchItem)" class="absolute bg-white w-full mt-2 shadow-lg rounded-lg z-50 border max-h-96 overflow-y-auto">
            <div v-if="isSearching" class="p-4 text-center text-sm text-gray-500">Searching...</div>
            <div v-else-if="!searchResults.length && searchItem" class="p-4 text-center text-sm text-gray-500">No results for "{{ searchItem }}"</div>
            <div v-else>
              <div v-for="item in searchResults" :key="item.id" class="p-2 border-b last:border-b-0">
                <NuxtLink :to="`/product/${item.id}`" @click="isSearchFocused = false" class="flex items-center justify-between w-full p-2 rounded hover:bg-gray-50">
                  <div class="flex items-center min-w-0">
                    <img class="rounded-md w-10 h-10 object-cover" :src="item.media?.[0]?.url || '/default-product.png'" :alt="item.title" />
                    <div class="truncate ml-3 text-sm text-gray-800">{{ item.title }}</div>
                  </div>
                  <div class="text-sm font-medium text-[#f02c56]">{{ formatPrice(item.price) }}</div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Right Actions -->
      <div 
        class="flex items-center gap-2 sm:gap-4 transition-all duration-300"
        :class="{ 'hidden sm:flex': isMobile && isSearchFocused }"
      >
        <div v-if="!userStore.isLoggedIn" class="flex items-center gap-2"> 
          <!-- UPDATED BUTTON: "Become a Seller" -->
          <NuxtLink to="/seller/profile/create-profile" class="flex items-center bg-[#f02c56] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#d81b36] transition-all whitespace-nowrap">
            Become a Seller
          </NuxtLink>
          <NuxtLink to="/auth/login" class="flex items-center bg-[#f02c56] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#d81b36] transition-all whitespace-nowrap">
            Login
          </NuxtLink>
        </div>
        <div v-else-if="userStore.isLoggedIn && userStore.isSeller" class="flex items-center gap-2 sm:gap-4">
          <NuxtLink to="/upload" class="flex items-center text-sm font-medium text-gray-600 hover:text-[#f02c56]" aria-label="Upload product">
            <Icon name="mdi:plus-box-outline" size="22" />
            <span class="ml-1">Upload</span>
          </NuxtLink>
          <NuxtLink to="/seller/dashboard" class="hidden md:flex items-center text-sm font-medium text-gray-600 hover:text-[#f02c56]" aria-label="Upload product">
            <Icon name="mdi:view-dashboard-outline" size="22" />
            <span class="ml-1">Dashboard</span>
          </NuxtLink>
          <button @click="logout"class="flex ml-20 items-right text-sm font-medium text-[#f02c56] hover:text-[#f02c56]/2" aria-label="Upload product">
            <Icon name="mdi:logout" size="22" />
            <span class="hidden md:flex ml-1">Logout</span>
          </button>
        </div>
        <div v-if="userStore.isLoggedIn && !userStore.isSeller" class="flex pl-10 items-center gap-2 sm:gap-4">
            <NuxtLink to="/seller/profile/create-profile" class="flex items-center bg-[#f02c56] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#d81b36] transition-all whitespace-nowrap">
            Become a Seller
          </NuxtLink>
           <NuxtLink to="buyer/profile" class="hidden md:flex p-1.5 rounded-full hover:bg-gray-100" aria-label="Toggle user menu">
              <img :src="userStore.userProfile?.avatar || 'https://picsum.photos/id/1005/32'" class="w-9 h-9 rounded-full" />
           </NuxtLink>
          <button @click="logout"class="flex ml-20 items-right text-sm font-medium text-[#f02c56] hover:text-[#f02c56]/2" aria-label="Upload product">
            <Icon name="mdi:logout" size="22" />
            <span class="hidden md:flex ml-1">Logout</span>
          </button>
        </div>

        <!-- <div v-else class="flex items-center gap-2 sm:gap-4">
          <NuxtLink to="/upload" v-if="userStore.isSeller" class="hidden md:flex items-center text-sm font-medium text-gray-600 hover:text-[#f02c56]" aria-label="Upload product">
            <Icon name="mdi:plus-box-outline" size="22" />
            <span class="ml-1">Upload</span>
          </NuxtLink>
          
          <div v-click-outside="() => showMenu = false" class="relative">
            <button @click="showMenu = !showMenu" class="p-1.5 rounded-full hover:bg-gray-100" aria-label="Toggle user menu">
              <img :src="userStore.userProfile?.avatar || 'https://picsum.photos/id/1005/32'" class="w-9 h-9 rounded-full" />
            </button>
            <transition
                enter-active-class="transition-all duration-200 ease-out"
                leave-active-class="transition-all duration-200 ease-in"
                enter-from-class="opacity-0 scale-95"
                leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showMenu" class="absolute bg-white rounded-lg py-2 w-52 shadow-lg border top-12 right-0 z-50">
                <div class="px-4 py-2 border-b">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ userStore.userProfile?.username || userStore.user?.email }}</p>
                    <p class="text-xs text-gray-500">{{ userStore.isSeller ? 'Seller Account' : 'Buyer Account' }}</p>
                </div>
                <div class="py-1">
                    <NuxtLink v-if="userStore.isSeller" to="/seller/Dashboard" @click="showMenu = false" class="flex items-center py-2 px-4 text-sm text-gray-700 hover:bg-gray-100">
                        <Icon name="mdi:view-dashboard-outline" size="20" class="mr-3" /> Dashboard
                    </NuxtLink>
                    <NuxtLink v-else to="/buyer/profile" @click="showMenu = false" class="flex items-center py-2 px-4 text-sm text-gray-700 hover:bg-gray-100">
                        <Icon name="mdi:account-circle-outline" size="20" class="mr-3" /> My Profile
                    </NuxtLink>
                </div>
                <button @click="logout" class="flex items-center py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 w-full text-left border-t mt-1 pt-2">
                  <Icon name="mdi:logout" size="20" class="mr-3" /> Log out
                </button>
              </div>
            </transition>
          </div>
        </div> -->
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '~/stores/user.store';
import { useDebounceFn } from '@vueuse/core';
import type { ProductInterface } from '~/models/interface/products/product.interface';

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

const showMenu = ref(false);
const searchItem = ref('');
const isSearching = ref(false);
const isSearchFocused = ref(false);
const searchResults = ref<ProductInterface[]>([]);
const isMobile = ref(false);

const checkScreenSize = () => {
    isMobile.value = window.innerWidth < 640; // Tailwind's 'sm' breakpoint
};

const performSearch = useDebounceFn(async () => {
  if (!searchItem.value) {
    searchResults.value = [];
    return;
  }
  isSearching.value = true;
  try {
    const results = await $fetch<ProductInterface[]>(`/api/prisma/search/search-by-name/${searchItem.value}`);
    searchResults.value = results;
  } catch (err) {
    console.error('Search error:', err);
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

watch(searchItem, performSearch);

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchUserAndProfile();
  }
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkScreenSize);
});
</script>