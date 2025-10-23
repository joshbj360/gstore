<template>
    <header class="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-20">
        <nav class="h-14 px-4 flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <!-- Logo: Home Anchor -->
            <NuxtLink to="/" class="flex items-center space-x-3 shrink-0 group">
                <!-- <div
                    class="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-md">
                    <Icon name="mdi:shopping" class="w-6 h-6 text-white" />
                </div> -->

                <div class="hidden sm:flex flex-col leading-tight text-wrap">
                    <span
                        class="text-lg font-extrabold text-neutral-100 tracking-wider group-hover:text-brand transition-colors">
                        AH-SHAY
                    </span>
                    <span class="text-xs font-medium text-neutral-400 italic">
                        Harmony of Style
                    </span>
                </div>
            </NuxtLink>
            <div class="flex-1"></div>

            <!-- Search Bar (Desktop) -->
            <div class="hidden sm:block flex-1 max-w-lg">
                <SearchBar @open-ai-chat="handleOpenAIChat" />
            </div>

            <!-- THE FIX: Center Navigation for Desktop -->
            <div class="hidden md:flex items-center justify-center flex-1">
                <div class="flex space-x-2 bg-neutral-800 p-1 rounded-full">
                    <NuxtLink to="/" class="nav-button" active-class="active">
                        <Icon name="mdi:home" size="22" />
                    </NuxtLink>
                    <NuxtLink to="/discover" class="nav-button" active-class="active">
                        <Icon name="mdi:view-grid-outline" size="22" />
                    </NuxtLink>
                    <NuxtLink to="/reels" class="nav-button" active-class="active">
                        <Icon name="mdi:play-box-outline" size="22" />
                    </NuxtLink>
                </div>
            </div>

            <!-- Right: Icons & Profile -->
            <div class="flex items-center space-x-2">
                <!-- Search Icon (Mobile) -->
                <button @click="isSearchOverlayVisible = true"
                    class="p-2 group rounded-full hover:bg-neutral-800 sm:hidden">
                    <Icon name="mdi:magnify" size="22" class="text-neutral-300 group-hover:text-white" />
                </button>

                <NuxtLink to="/buyer/cart" class="relative p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 group">
                    <Icon name="mdi:cart-outline" size="20" class="text-neutral-300 group-hover:text-white" />
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
                            class="p-1.5 rounded-full hover:bg-neutral-800 transition-all group">
                            <img :src="userStore.userProfile?.avatar || `https://avatar.iran.liara.run/public/boy?username=${userStore.userProfile?.username || 'user'}`"
                                class="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-[#f02c56]" />
                        </button>
                        <transition enter-active-class="transition-all duration-200"
                            leave-active-class="transition-all duration-150">
                            <div v-if="showMenu"
                                class="absolute right-0 mt-2 w-48 bg-neutral-900 rounded-lg shadow-lg z-50 border border-neutral-700 py-2">
                                <!-- User Info Header -->
                                <NuxtLink :to="userStore.isSeller
                                    ? `/seller/dashboard`
                                    : '/buyer/profile'"
                                    class="px-4 py-2 border-b border-neutral-700 block hover:bg-neutral-800/30">
                                    <div>
                                        <p class="text-sm font-medium truncate text-neutral-100">
                                            {{ userStore.userProfile?.username }}
                                        </p>
                                        <p class="text-xs text-neutral-400">
                                            {{ userStore.isSeller ? 'Seller Mode' : 'Buyer Mode' }}
                                        </p>
                                    </div>
                                </NuxtLink>

                                <!-- Profile Link -->
                                <NuxtLink :to="userStore.isSeller
                                    ? `/seller/profile/${userStore.sellerProfile?.store_slug}`
                                    : '/buyer/profile'" @click="showMenu = false"
                                    class="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white">
                                    Profile
                                </NuxtLink>

                                <!-- Orders (only for buyers) -->
                                <NuxtLink v-if="!userStore.isSeller" to="/buyer/orders" @click="showMenu = false"
                                    class="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white">
                                    Orders
                                </NuxtLink>

                                <!-- Logout -->
                                <button @click="logout"
                                    class="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white border-t border-neutral-700">
                                    Log Out
                                </button>
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
import { useRouter } from 'vue-router';
import SearchBar from '~/components/search/SearchBarWithAI.vue';
import SearchOverlay from '~/components/search/SearchOverLay.vue';
import AIChat from '~/components/chat/AIChat.vue';

const cartStore = useCartStore();
const userStore = useUserStore();
const router = useRouter();

const isSearchOverlayVisible = ref(false);
const showAI = ref(false);
const initialAIQuery = ref('');
const showMenu = ref(false);

const handleOpenAIChat = (query: string) => {
    isSearchOverlayVisible.value = false;
    initialAIQuery.value = query;
    showAI.value = true;
};

const logout = async () => {
    await userStore.logout();
    showMenu.value = false;
    await router.push('/auth/login');
};
</script>

<style scoped>
.nav-button {
    @apply p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors;
}

.nav-button.active {
    @apply bg-brand text-white;
}
</style>
