<template>
  <nav id="top-nav" class="fixed bg-white z-50 w-full border-b border-gray-200 h-14 sm:h-16" role="navigation" aria-label="Main navigation">
    <div class="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 h-full">
      <!-- Logo -->
      <div class="flex-shrink-0">
        <NuxtLink to="/" class="flex items-center" aria-label="Go to homepage">
          <img
            src="~/assets/images/grandeur-logo.png"
            alt="Grandeur Logo"
            class="h-8 w-auto"
            loading="lazy"
          />
        </NuxtLink>
      </div>

      <!-- Categories Dropdown (Mobile Hidden) -->
      <!-- <div class="hidden sm:flex items-center mx-2 sm:mx-3">
        <button
          @click="showCategories = !showCategories"
          class="flex items-center text-gray-600 hover:text-[#f02c56] text-sm sm:text-base font-medium p-1.5 rounded-lg hover:bg-[#f02c56]/10 transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50"
          aria-label="Toggle categories menu"
          :aria-expanded="showCategories"
        >
          <Icon name="mdi:menu" size="16" class="mr-1" />
          Categories
        </button>
        <div
          v-if="showCategories"
          class="absolute bg-white rounded-lg py-2 w-48 shadow-lg border mt-40 sm:mt-12 top-0 z-50"
        >
          <NuxtLink
            v-for="category in categories"
            :key="category.id"
            @click="showCategories = false"
            class="flex items-center py-2 px-3 text-sm text-gray-600 hover:bg-[#f02c56]/10 hover:text-[#f02c56] transition-all duration-250"
          >
            {{ category.name }}
          </NuxtLink>
          <div v-if="!categories.length" class="py-2 px-3 text-sm text-gray-500">No categories</div>
        </div>
      </div> -->

      <!-- Search Bar -->
      <div
        class="flex-1 mx-1 sm:mx-2 transition-all duration-250"
        :class="isSearchFocused ? 'w-full sm:max-w-md' : 'max-w-[120px] sm:max-w-xs'"
      >
        <div class="relative w-full">
          <div class="flex items-center bg-gray-100 p-1 rounded-lg">
            <input
              v-model="searchItem"
              type="text"
              class="w-full bg-transparent px-3 py-1.5 text-sm sm:text-base placeholder-gray-500 focus:outline-none"
              placeholder="Search products..."
              @focus="onSearchFocus"
              @blur="onSearchBlur"
              aria-label="Search products"
            />
            <Icon
              v-if="isSearching"
              name="mdi:loading"
              size="16"
              class="absolute right-10 sm:right-12 text-gray-500 animate-spin"
            />
            <button
              type="button"
              class="px-2 sm:px-3"
              @click="search"
              aria-label="Search"
            >
              <Icon name="mdi:magnify" size="16" class="text-gray-600 hover:text-[#f02c56]" />
            </button>
          </div>
          <div
            v-if="items.length"
            class="absolute bg-white w-full max-w-full mt-1 shadow-lg rounded-lg z-50 border"
          >
            <div
              v-for="item in items"
              :key="item.id"
              class="p-2 border-b last:border-b-0 hover:bg-[#f02c56]/10 transition-all duration-250"
            >
              <NuxtLink
                :to="`/products/${item.id}`"
                class="flex items-center justify-between w-full p-1 sm:p-2 rounded"
              >
                <div class="flex items-center min-w-0">
                  <img
                    class="rounded-md w-6 h-6 object-cover"
                    :src="item.media?.[0]?.url || 'https://picsum.photos/id/1005/200'"
                    :alt="item.title"
                    loading="lazy"
                  />
                  <div class="truncate ml-2 text-sm text-gray-800">{{ item.title }}</div>
                </div>
                <div class="text-sm font-medium text-[#f02c56]">${{ (item.price / 100).toFixed(2) }}</div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Actions -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Logged Out -->
        <div v-if="!userStore.isLoggedIn" class="flex items-center gap-2"> 
          <NuxtLink
            to="/cart"
            class="relative pt-3 hover:bg-[#f02c56]/10 rounded-lg transition-all duration-250"
            aria-label="View cart"
          >
            <Icon name="mdi:cart-outline" size="23" class="text-gray-600 hover:text-[#f02c56] pt-2" />
            <span
              v-if="cartStore.cartItems.length"
              class="absolute -top-1 -right-1 mt-1 bg-[#f02c56] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center"
            >
              {{ cartStore.cartItems.length }}
            </span>
          </NuxtLink>
          <button
            @click="router.push('/auth/login')"
            class="flex items-center bg-[#f02c56] text-white rounded-lg px-2 sm:px-3 py-1.5 text-sm font-medium hover:bg-[#d81b36] transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50"
            aria-label="Log in"
          >
            <span class="mx-1 sm:mx-2 hidden sm:flex">Log in</span>
            <Icon name="mdi:account" size="23" class="sm:hidden" />
          </button>
        </div>

        <!-- Logged In -->
        <div v-else class="flex items-center gap-2 sm:gap-3">
          <!-- <button
            v-if="userStore.userProfile?.role === 'seller'"
            @click="router.push('/upload')"
            class="pt-3 hover:bg-[#f02c56]/10 rounded-lg transition-all duration-250"
            aria-label="Upload product"
          >
            <Icon name="mdi:plus" size="23" class="text-gray-600 hover:text-[#f02c56]" />
          </button> -->
          <NuxtLink
            to="/cart"
            class="relative pt-3 px-1.5 hover:bg-[#f02c56]/10 rounded-lg transition-all duration-250"
            aria-label="View cart"
          >
            <Icon name="mdi:cart-outline" size="23" class="text-gray-600 hover:text-[#f02c56]" />
            <span
              v-if="cartStore.cartItems.length"
              class="absolute -top-1 -right-1 bg-[#f02c56] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center"
            >
              {{ cartStore.cartItems.length }}
            </span>
          </NuxtLink>
          <NuxtLink
            to="/messages"
            class="hidden md:flex px-1.5 pt-2 hover:bg-[#f02c56]/10 rounded-lg transition-all duration-250"
            aria-label="View messages"
          >
            <Icon name="mdi:email-outline" size="23" class="text-gray-600 hover:text-[#f02c56]" />
          </NuxtLink>
          <div class="relative">
            <button
              @click="showMenu = !showMenu"
              class="p-1.5 hover:bg-[#f02c56]/10 rounded-lg transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50"
              aria-label="Toggle user menu"
              :aria-expanded="showMenu"
            >
              <img
                :src="userStore.userProfile?.avatar || 'https://picsum.photos/id/1005/32'"
                :alt="userStore.userProfile?.email || 'User'"
                class="w-8 h-8 rounded-full"
                loading="lazy"
              />
            </button>
            <div
              v-if="showMenu"
              class="absolute bg-white rounded-lg py-2 w-48 shadow-lg border top-12 right-0 z-50"
            >
              <NuxtLink
                v-if="userStore.isSeller"
                to="/upload"
                @click="showMenu = false"
                class="flex items-center py-2 px-3 text-sm text-gray-600 hover:bg-[#f02c56]/10 hover:text-[#f02c56] transition-all duration-250"
              >
                <Icon name="mdi:plus-box" size="23" class="mr-2" />
                Add Product
              </NuxtLink>
              <NuxtLink
                v-if="!userStore.isSeller"
                to="/seller/profile/create-profile"
                @click="showMenu = false"
                class="flex items-center py-2 px-3 text-sm text-gray-600 hover:bg-[#f02c56]/10 hover:text-[#f02c56] transition-all duration-250"
              >
                <Icon name="mdi:plus-box" size="23" class="mr-2" />
                Become a seller
              </NuxtLink>
              <NuxtLink
                v-if="!userStore.isSeller"
                to="/buyer/profile"
                @click="showMenu = false"
                class="flex items-center py-2 px-3 text-sm text-gray-600 hover:bg-[#f02c56]/10 hover:text-[#f02c56] transition-all duration-250"
              >
                <Icon name="mdi:account-details-outline" size="23" class="mr-2" />
                My Profile
              </NuxtLink>
              <NuxtLink
                v-if="userStore.isSeller"
                to="/seller/Dashboard"
                @click="showMenu = false"
                class="flex items-center py-2 px-3 text-sm text-gray-600 hover:bg-[#f02c56]/10 hover:text-[#f02c56] transition-all duration-250"
              >
                <Icon name="mdi:account-details-outline" size="23" class="mr-2" />
                Dashboard
              </NuxtLink>
              <button
                @click="logout"
                class="flex items-center py-2 px-3 text-sm text-gray-600 hover:bg-[#f02c56]/10 hover:text-[#f02c56] border-t w-full text-left transition-all duration-250"
              >
                <Icon name="mdi:logout" size="23" class="mr-2" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '~/stores/user.store';
import { useCartStore } from '~/stores/cart.store';
import { useDebounceFn } from '@vueuse/core';
import type { CategoryInterface } from '~/models/interface/products/category.interface';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const cartStore = useCartStore();

const showMenu = ref(false);
const showCategories = ref(false);
const searchItem = ref('');
const isSearching = ref(false);
const isSearchFocused = ref(false);
const items = ref<any[]>([]);
const categories = ref<CategoryInterface[]>([]);

// const fetchCategories = async () => {
//   try {
//     const { data } = await useSupabaseClient().from('categories').select('*').limit(4);
//     categories.value = data || [];
//   } catch (err) {
//     console.error('Category fetch error:', err);
//   }
// };

const onSearchFocus = () => {
  isSearchFocused.value = true;
};

const onSearchBlur = () => {
  setTimeout(() => {
    isSearchFocused.value = false;
  }, 200);
};

const search = useDebounceFn(async () => {
  if (!searchItem.value) {
    items.value = [];
    isSearching.value = false;
    return;
  }
  isSearching.value = true;
  try {
    const response = await $fetch<{ data: any[] }>(`/api/prisma/products`, {
      query: { q: searchItem.value },
    });
    items.value = response.data || [];
  } catch (err) {
    console.error('Search error:', err);
    items.value = [];
  } finally {
    isSearching.value = false;
  }
}, 300);

const logout = async () => {
  try {
    await userStore.logout();
    showMenu.value = false;
    await router.push('/');
  } catch (err) {
    console.error('Logout error:', err);
  }
};

watch(searchItem, () => {
  search();
  console.log(userStore.isSeller)
});

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetchUserAndProfile();
  }
  // await fetchCategories();
  console.log(userStore.isSeller)

});
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
