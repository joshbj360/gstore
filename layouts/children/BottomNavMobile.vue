<template>
    <!-- This component is fixed to the bottom and only visible on mobile screens -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-neutral-900 border-t border-neutral-800 z-20">
        <nav class="h-full flex items-center justify-around">
            <NuxtLink to="/" class="nav-button" active-class="text-brand">
                <Icon name="mdi:home" size="26" />
            </NuxtLink>
            <NuxtLink to="/discover" class="nav-button" active-class="text-brand">
                <Icon name="mdi:view-grid-outline" size="26" />
            </NuxtLink>
            <button v-if="userStore.isLoggedIn && userStore.isSeller" @click="$emit('create')"
                class="transform -translate-y-4">
                <div class="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
                    <Icon name="mdi:plus" size="32" />
                </div>
            </button>
            <NuxtLink to="/reels" class="nav-button" active-class="text-brand">
                <Icon name="mdi:play-box-outline" size="26" />
            </NuxtLink>
            <NuxtLink v-if="userStore.isLoggedIn && userStore.isSeller" to="/seller/dashboard" class="nav-button" active-class="active">
                <Icon name="mdi:view-dashboard-outline" size="26" />
            </NuxtLink>
            <NuxtLink v-if="userStore.isLoggedIn" to="/buyer/profile" class="nav-button" active-class="text-brand">
                <img :src="userStore.userProfile?.avatar || formatAvatarUrl(userStore.userProfile?.username)"
                    class="w-7 h-7 rounded-full" />
            </NuxtLink>
            <NuxtLink v-else to="/auth/login" class="nav-button" active-class="text-brand">
                <Icon name="mdi:login-variant" size="26" class="w-7 h-7 rounded-full" />
            </NuxtLink>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores';
const userStore = useUserStore();
defineEmits(['create'])
</script>

<style scoped>
.nav-button {
    @apply p-2 text-neutral-400 hover:text-white transition-colors;
}
</style>
