<template>
  <div class="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
   <NuxtNotifications position="bottom right" :speed="500" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore, useCartStore, useLikeStore, useFollowStore } from '~/stores';
import { useSupabaseClient } from '#imports';

const colorMode = useColorMode();
colorMode.preference = colorMode.preference || 'dark';

const userStore = useUserStore();
const cartStore = useCartStore();
const likeStore = useLikeStore();
const followStore = useFollowStore();
const notificationStore = useNotificationStore();
const supabase = useSupabaseClient();

supabase.auth.onAuthStateChange(async (event, session) => {
  
  if (event === 'SIGNED_IN') {
    console.log("Auth Event: SIGNED_IN. Fetching profile & merging cart...");
    await userStore.fetchUserAndProfile();
    // Re-fetch layout data to get new private user data (likes/follows)
    if (session?.user.id) {
        notificationStore.listenForNotifications(session.user.id);
    }
    await refreshNuxtData('layout-data');
  }
  
  if (event === 'SIGNED_OUT') {
    console.log("Auth Event: SIGNED_OUT. Resetting all user stores...");
    userStore.reset();
    cartStore.reset();
    likeStore.reset();
    followStore.reset();
    await refreshNuxtData('layout-data');
  }
});

/**
 * This hook now *only* fetches data that is NOT part of the critical
 * initial layout render (like the cart).
 * Likes and Follows are handled by `useLayoutData`.
 */
onMounted(() => {
  if (userStore.isLoggedIn) {
    console.log("App mounted. User is already logged in. Fetching cart/profile.");
    userStore.fetchUserAndProfile(); // Fetches profile if not already present
    cartStore.fetchCartItems() // Fetches the DB cart, does NOT merge
    if (userStore.user?.id) {
        notificationStore.listenForNotifications(userStore.user.id);
    }
  } else {
    console.log("App mounted. User is a guest.");
  }
});
</script>

<style>
/* Notification theme styles */
:root {
  --vn-bg-color: #262626;
  --vn-border-color: #404040;
  --vn-text-color: #f5f5f5;
  --vn-success-color: #22c55e;
  --vn-error-color: #ef4444;
  --vn-warn-color: #f97316;
  --vn-info-color: #3b82f6;
}
html:not(.dark) {
  --vn-bg-color: #ffffff;
  --vn-border-color: #e5e7eb;
  --vn-text-color: #171717;
}
</style>