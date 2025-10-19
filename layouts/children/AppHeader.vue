<template>
    <header class="bg-white shadow-sm sticky top-0 z-20">
        <nav class="h-14 px-4 flex items-center justify-between gap-4">
            <!-- Logo: Home Anchor -->
            <NuxtLink to="/" class="flex items-center space-x-2 shrink-0">
                <div
                    class="w-10 h-10 bg-brand rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                    <Icon name="mdi:shopping" class="w-6 h-6 text-white" />
                </div>
                <span class="hidden sm:inline text-lg font-bold text-gray-800 tracking-wider">Aura</span>
            </NuxtLink>

            <!-- Search Bar (Desktop) -->
            <div class="hidden sm:block flex-1 max-w-lg">
                <SearchBarWithAI @open-ai-chat="handleOpenAIChat" />
            </div>

            <!-- Right: Icons & Profile -->
            <div class="flex items-center space-x-2">
                <!-- Search Icon (Mobile) -->
                <button @click="isSearchOverlayVisible = true"
                    class="p-2 group rounded-full hover:bg-gray-100 sm:hidden">
                    <Icon name="mdi:magnify" size="22" class="text-gray-600 group-hover:text-brand" />
                </button>
                <div class="flex space-x-0.5 sm:space-x-1">
                    <NuxtLink to="/discover" class="p-1.5 sm:p-2 group rounded-full hover:bg-gray-50 transition-all"
                        title="All Products">
                        <Icon name="mdi:view-grid" size="20"
                            class=" text-gray-600 group-hover:text-brand group-hover:scale-105" />
                    </NuxtLink>
                    <NuxtLink to="/reels" class="p-1.5 sm:p-2 group rounded-full hover:bg-gray-50 transition-all"
                        title="Reels">
                        <Icon name="mdi:play-circle" size="20"
                            class="text-gray-600 group-hover:text-brand group-hover:scale-105" />
                    </NuxtLink>
                </div>
                <NuxtLink to="/buyer/cart" class="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 group">
                    <Icon name="mdi:cart-outline" size="20" class="text-gray-600 group-hover:text-brand" />
                    <span v-if="cartStore.cartCount > 0"
                        class="absolute -top-1 -right-0.5 bg-brand text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                        {{ cartStore.cartCount }}
                    </span>
                </NuxtLink>


                <!-- Profile/Auth -->
                <NuxtLink v-if="!userStore.isLoggedIn" to="/auth/login"
                    class="hidden sm:inline px-4 py-2 bg-brand text-white rounded-md text-sm font-semibold hover:bg-[#d81b36]">
                    Sign In
                </NuxtLink>
                <ClientOnly v-else>
                    <div v-click-outside="() => showMenu = false" class="relative">
                        <button @click="showMenu = !showMenu"
                            class="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-all group" aria-label="Menu">
                            <img :src="userStore.userProfile?.avatar || `https://avatar.iran.liara.run/public/boy?username=${userStore.userProfile?.username || 'user'}`"
                                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-1 ring-transparent group-hover:ring-brand" />
                        </button>
                        <transition enter-active-class="transition-all duration-200"
                            leave-active-class="transition-all duration-150">
                            <div v-if="showMenu"
                                class="absolute right-0 mt-1 sm:mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-lg z-50 border py-2">
                                <NuxtLink
                                    :to="userStore.isSeller ? `/seller/profile/${userStore.sellerProfile?.store_slug}` : '/pages/buyer/profile'"
                                    class="flex flex-col px-3 sm:px-4 py-2 border-b hover:bg-gray-50 transition-colors"
                                    >
                                    <p class="text-sm font-medium truncate">
                                        {{ userStore.userProfile?.username || 'Guest User' }}
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        {{ userStore.isSeller ? `${userStore.sellerProfile?.store_name} Store` : 'Buyer Mode' }}
                                    </p>
                                </NuxtLink>
                                <NuxtLink to="/seller/dashboard" @click="showMenu = false"
                                    class="block px-3 sm:px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
                                    <Icon name="mdi:view-dashboard-outline" class="w-4 h-4 inline-block mr-2" />
                                    Dashboard
                                </NuxtLink>
                                <NuxtLink to="/upload" @click="showMenu = false"
                                    class="block px-3 sm:px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
                                    <Icon name="mdi:upload" class="w-4 h-4 inline-block mr-2" /> Add products
                                </NuxtLink>
                                <NuxtLink  v-if="!userStore.isSeller" to="/buyer/profile" @click="showMenu = false"
                                    class="block px-3 sm:px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
                                    <Icon name="mdi:account" class="w-4 h-4 inline-block mr-2" /> Profile
                                </NuxtLink>
                                <NuxtLink v-if="!userStore.isSeller" to="/orders" @click="showMenu = false"
                                    class="block px-3 sm:px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
                                    <Icon name="mdi:clipboard-list" class="w-4 h-4 inline-block mr-2" /> Orders
                                </NuxtLink>
                                <button @click="logout"
                                    class="w-full text-left px-3 sm:px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-t">Log
                                    Out</button>
                            </div>
                        </transition>
                    </div>
                </ClientOnly>
            </div>
        </nav>

        <!-- Mobile Search Overlay -->
        <SearchOverlay :is-visible="isSearchOverlayVisible" @close="isSearchOverlayVisible = false"
            @open-ai-chat="handleOpenAIChat" />

        <!-- AI Chat Modal -->
        <AIChat v-if="showAI" @close="showAI = false" :initial-query="initialAIQuery" />
    </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCartStore, useUserStore } from '~/stores';
import SearchOverlay from '~/components/search/SearchOverLay.vue';
import AIChat from '~/components/chat/AIChat.vue';
import SearchBarWithAI from '~/components/search/SearchBarWithAI.vue';

const cartStore = useCartStore();
const userStore = useUserStore();
const router = useRouter();

const isSearchOverlayVisible = ref(false);
const showAI = ref(false);
const initialAIQuery = ref('');
const showMenu = ref(false);

const handleOpenAIChat = (query: string) => {
    isSearchOverlayVisible.value = false; // Close search when AI opens
    initialAIQuery.value = query;
    showAI.value = true;
};
const logout = async () => {
    await userStore.logout();
    showMenu.value = false;
    await router.push('/auth/login');
};
</script>
