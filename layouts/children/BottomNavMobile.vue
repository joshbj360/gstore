<template>
    <!-- This component is fixed to the bottom and only visible on mobile screens -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-neutral-900 border-t border-neutral-800 z-20">
        <nav class="h-full flex items-center justify-around">
            <NuxtLink to="/" class="nav-button" active-class="text-[#f02c56]">
                <Icon name="mdi:home" size="26" />
            </NuxtLink>
            <NuxtLink to="/discover" class="nav-button" active-class="text-[#f02c56]">
                <Icon name="mdi:view-grid-outline" size="26" />
            </NuxtLink>
            <NuxtLink to="/reels" class="nav-button" active-class="text-[#f02c56]">
                <Icon name="mdi:play-box-outline" size="26" />
            </NuxtLink>
            <NuxtLink v-if="userStore.isSeller" to="/seller/dashboard" class="nav-button" active-class="text-[#f02c56]">
                <Icon name="mdi:view-dashboard-outline" size="26" />
            </NuxtLink>
            <NuxtLink v-if="userStore.isLoggedIn" to="/buyer/profile" class="nav-button" active-class="text-[#f02c56]">
                 <img :src="userStore.userProfile?.avatar || `https://avatar.iran.liara.run/public/boy?username=${userStore.userProfile?.username || 'user'}`" class="w-7 h-7 rounded-full" />
            </NuxtLink>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores';
const userStore = useUserStore();
</script>

<style scoped>
.nav-button {
    @apply p-2 text-neutral-400 hover:text-white transition-colors;
}
</style>
