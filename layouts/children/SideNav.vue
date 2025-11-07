<template>
    <div class="flex flex-col h-full p-4">
        <!-- Logo -->
        <!-- Logo -->
        <NuxtLink to="/" class="mb-6 flex justify-center xl:justify-start">
            <!-- Desktop Logo -->
            <img src="~/assets/images/logo2.png" alt="Grandeur Logo" class="hidden xl:block h-10 w-auto" />

            <!-- Mobile Icon -->
            <div
                class="xl:hidden w-10 h-10 bg-gradient-to-br from-[#f02c56] to-purple-600 rounded-full flex items-center justify-center">
                <Icon name="mdi:store-fashion" class="w-5 h-5 text-white" />
            </div>
        </NuxtLink>


        <!-- Navigation Links -->
        <nav class="flex flex-col space-y-2">
            <NuxtLink to="/" class="nav-button" active-class="active">
                <Icon name="mdi:home" size="26" />
                <span class="nav-text">Home</span>
            </NuxtLink>

            <!-- THE FIX: The Search button has been restored -->
            <button @click="$emit('open-search')" class="nav-button">
                <Icon name="mdi:magnify" size="26" />
                <span class="nav-text">Search</span>
            </button>

            <NuxtLink to="/discover" class="nav-button" active-class="active">
                <Icon name="mdi:view-grid-outline" size="26" />
                <span class="nav-text">Discover</span>
            </NuxtLink>

            <NuxtLink to="/reels" class="nav-button" active-class="active">
                <Icon name="mdi:play-box-outline" size="26" />
                <span class="nav-text">Reels</span>
            </NuxtLink>

            <button v-if="userStore.isLoggedIn" @click="$emit('create')" class="nav-button">
                <Icon name="mdi:plus-circle-outline" size="26" />
                <span class="nav-text">Create</span>
            </button>
            <button v-if="userStore.isLoggedIn" @click="$emit('open-notifications')" class="nav-button relative">
                <div class="relative">
                    <Icon name="mdi:bell-outline" size="26" />
                    <!-- Red dot badge -->
                    <span v-if="notificationStore.unreadCount && notificationStore.unreadCount > 0" class="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-brand"></span>
                </div>
                <span class="nav-text">Notifications</span>
            </button>

            <NuxtLink v-if="userStore.isLoggedIn" to="/buyer/cart" class="nav-button relative"
                active-class="active">
                <div class="relative">
                    <Icon name="mdi:cart-outline" size="26" />
                    <!-- Numeric badge -->
                    <span v-if="cartStore.cartCount && cartStore.cartCount > 0"
                        class="absolute -top-2 -right-2 bg-brand text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {{ cartStore.cartCount }}
                    </span>
                </div>
                <span class="nav-text">Cart</span>
            </NuxtLink>

            <NuxtLink v-if="userStore.isLoggedIn" to="/seller/dashboard" class="nav-button relative"
                active-class="active">
                <div class="relative">
                    <Icon name="mdi:message-outline" size="26" />
                    <!-- Red dot badge -->
                    <span class="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-brand"></span>
                </div>
                <span class="nav-text">Messages</span>
            </NuxtLink>

            <NuxtLink v-if="userStore.isLoggedIn && userStore.isSeller" to="/seller/dashboard" class="nav-button"
                active-class="active">
                <Icon name="mdi:view-dashboard-outline" size="26" />
                <span class="nav-text">Dashboard</span>
            </NuxtLink>
        </nav>

        <!-- Profile Link (at the bottom) -->
        <div class="mt-auto">
            <ClientOnly>
                <NuxtLink v-if="userStore.isLoggedIn" to="/buyer/profile" class="nav-button" active-class="active">
                    <img :src="userStore.userProfile?.avatar || `https://avatar.iran.liara.run/public/boy?username=${userStore.userProfile?.username || 'user'}`"
                        class="w-7 h-7 rounded-full" />
                    <span class="nav-text">Profile</span>
                </NuxtLink>
                <NuxtLink v-else to="/auth/login" class="nav-button">
                    <Icon name="mdi:login-variant" size="26" />
                    <span class="nav-text">Sign In</span>
                </NuxtLink>
            </ClientOnly>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores';
const userStore = useUserStore();
const cartStore = useCartStore();
const notificationStore = useNotificationStore()
const config = useRuntimeConfig();

// THE FIX: Added 'open-search' to the emits
defineEmits(['create', 'open-search', 'open-notifications']);
</script>

<style scoped>
/* THE FIX: 
  - Base classes are now light-theme friendly (e.g., text-gray-600)
  - Dark-mode styles are applied with `dark:` prefixes
*/
.nav-button {
    @apply flex items-center gap-4 p-3 rounded-lg text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition-colors;
}

.nav-button.active {
    @apply text-gray-900 dark:text-white font-semibold bg-gray-100 dark:bg-neutral-800;
}

.nav-text {
    @apply hidden xl:inline;
    /* Only show text on extra-large screens */
}
</style>
