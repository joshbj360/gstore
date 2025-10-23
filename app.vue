<template>
  <div class="min-h-screen bg-background-dark">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { useUserStore } from '~/stores/user.store';
import { useCartStore } from '~/stores/cart.store';
import { useSupabaseClient } from '#imports';

const userStore = useUserStore();
const cartStore = useCartStore();
const supabase = useSupabaseClient();
const $colorMode = useColorMode() // Automatically handles theme persistence


// This listener fires whenever the user's login state changes.
supabase.auth.onAuthStateChange(async (event, session) => {
  // Check if the event is a successful sign-in
  if (event === 'SIGNED_IN') {
    //
    // THIS IS WHERE YOU CALL THE ACTION
    //
    // Before fetching the user's DB cart, we merge any items they had as a guest.
    await cartStore.mergeAndSyncCartOnLogin();

    // Now, we fetch the user's full profile and other data
     await userStore.fetchUserAndProfile();
  }

  if (event === 'SIGNED_OUT') {
    // When the user logs out, reset the cart
    cartStore.resetCart();
  }
});
</script>