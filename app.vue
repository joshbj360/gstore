<template>
  <!-- 
    THE FIX: The root div is now theme-aware.
    It defaults to the light theme and applies dark classes when the `dark` class is on the <html> tag.
  -->
  <div class="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <notifications position="bottom right" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
// THE FIX: We import all the necessary stores for app initialization.
import { useUserStore, useCartStore, useLikeStore, useFollowStore } from '~/stores';
import { useSupabaseClient } from '#imports';

// THE FIX: We do NOT import `useColorMode`. Nuxt provides it automatically.
// This call now correctly uses the Nuxt Color Mode module.
const colorMode = useColorMode();
// We can set 'dark' as the default, but it will respect the user's saved preference.
colorMode.preference = colorMode.preference || 'dark';

const userStore = useUserStore();
const cartStore = useCartStore();
const likeStore = useLikeStore();
const followStore = useFollowStore();
const supabase = useSupabaseClient();

/**
 * This listener handles the authentication state for the entire application.
 */
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    // 1. Fetch the user's core profile data
    await userStore.fetchUserAndProfile();
    // 2. Merge their local guest cart with their database cart
    await cartStore.mergeAndSyncCartOnLogin();
    // 3. Fetch their private social data (likes and follows)
    await Promise.all([
        likeStore.fetchUserLikes(),
        followStore.fetchUserFollows()
    ]);
  }
  if (event === 'SIGNED_OUT') {
    // On logout, clear all user-specific state
    userStore.reset();
    cartStore.reset();
    likeStore.reset();
    followStore.reset();
  }
});

/**
 * THE FIX: This `onMounted` hook handles the case for a user who is already logged in
 * (e.g., returning to the site). It fetches all their private social data.
 */
onMounted(() => {
  if (userStore.isLoggedIn) {
    likeStore.fetchUserLikes();
    followStore.fetchUserFollows();
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

