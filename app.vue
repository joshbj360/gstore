<template>
  <!-- 
    This root div is now theme-aware.
    It defaults to the light theme and applies dark classes when the `dark` class is on the <html> tag.
  -->
  <div class="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
   <NuxtNotifications position="top right" :speed="500" />

  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore, useCartStore, useLikeStore, useFollowStore } from '~/stores';
import { useSupabaseClient } from '#imports';

// This call now correctly uses the Nuxt Color Mode module.
const colorMode = useColorMode();
colorMode.preference = colorMode.preference || 'dark';

const userStore = useUserStore();
const cartStore = useCartStore();
const likeStore = useLikeStore();
const followStore = useFollowStore();
const supabase = useSupabaseClient();

/**
 * This listener now *only* handles NEW login/logout events.
 * It no longer runs on page refresh (TOKEN_REFRESHED).
 */
supabase.auth.onAuthStateChange(async (event, session) => {
  
  // This event fires *only* when a user actively logs IN.
  if (event === 'SIGNED_IN') {
    console.log("Auth Event: SIGNED_IN. Merging guest cart...");
    // 1. Fetch profile (this is new for this session)
    await userStore.fetchUserAndProfile();
    // 2. THIS IS THE KEY: Merge the guest cart with the DB cart.
    //await cartStore.mergeAndSyncCartOnLogin();
    // 3. Fetch social data (this is new for this session)
    // await Promise.all([
    //     likeStore.fetchUserLikes(),
    //     followStore.fetchUserFollows()
    // ]);
  }
  
  // This event fires *only* when a user actively logs OUT.
  if (event === 'SIGNED_OUT') {
    console.log("Auth Event: SIGNED_OUT. Resetting all user stores...");
    userStore.reset();
    cartStore.reset();
    likeStore.reset();
    followStore.reset();
  }
});

/**
 * This hook handles the initial page load for a user
 * who is *already* logged in (e.g., a page refresh).
 */
onMounted(() => {
  if (userStore.isLoggedIn) {
    console.log("App mounted. User is already logged in. Fetching data...");
    // 1. Fetch profile
    userStore.fetchUserAndProfile();
    // 2. THIS IS THE KEY: Fetch the DB cart, DO NOT merge.
    cartStore.fetchCartItems();
  } else {
    console.log("App mounted. User is a guest.");
  }
});
</script>

<style>
/* This ensures your notifications match the dark theme */
:root {
  --vn-bg-color: #262626; /* neutral-800 */
  --vn-border-color: #404040; /* neutral-700 */
  --vn-text-color: #f5f5f5; /* neutral-100 */
  --vn-success-color: #22c55e;
  --vn-error-color: #ef4444;
  --vn-warn-color: #f97316;
  --vn-info-color: #3b82f6;
}

/* This is the light-theme definition */
html:not(.dark) {
  --vn-bg-color: #ffffff;
  --vn-border-color: #e5e7eb;
  --vn-text-color: #171717;
}
</style>