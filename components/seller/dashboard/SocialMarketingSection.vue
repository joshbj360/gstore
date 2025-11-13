<template>
  <div class="text-gray-900 dark:text-neutral-100 space-y-8">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">Social & Marketing</h2>
      <p class="text-sm text-gray-600 dark:text-neutral-400 mt-1">Manage your connected accounts and promote your products.</p>
    </div>

    <!-- Connected Platforms -->
    <div class="form-section">
      <h3 class="section-title">Connected Platforms</h3>
      <p class="text-sm text-gray-500 dark:text-neutral-400 mb-4">Connect accounts to auto-post new products and create social campaigns.</p>
      
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Instagram / Facebook Button -->
        <button 
          v-if="!isConnected('facebook')"
          @click="connect('facebook')" 
          :disabled="isLoading"
          class="social-connect-btn"
        >
          <Icon name="mdi:instagram" class="text-pink-500" size="20" /> 
          {{ isLoading ? 'Connecting...' : 'Connect Instagram' }}
        </button>
        <div v-else class="social-connected-badge">
          <Icon name="mdi:check-circle" class="text-green-500" size="20" />
          <span>Instagram Connected</span>
        </div>

        <!-- Twitter (X) Button -->
        <button 
          v-if="!isConnected('twitter')"
          @click="connect('twitter')" 
          :disabled="isLoading"
          class="social-connect-btn"
        >
          <Icon name="mdi:twitter" class="text-blue-400" size="20" /> 
          {{ isLoading ? 'Connecting...' : 'Connect X (Twitter)' }}
        </button>
        <div v-else class="social-connected-badge">
          <Icon name="mdi:check-circle" class="text-green-500" size="20" />
          <span>Twitter Connected</span>
        </div>
      </div>
    </div>

    <!-- Promote Existing Products -->
    <div class="form-section">
      <h3 class="section-title">Promote a Product</h3>
      <p class="text-sm text-gray-500 dark:text-neutral-400 mb-4">Select an existing product to create a new promotional post for your socials.</p>
      
      <div v-if="!products.length" class="text-center p-8 text-gray-500 dark:text-neutral-500">
        You have no products to promote.
      </div>
      
      <ul v-else class="divide-y divide-gray-200 dark:divide-neutral-800">
        <li v-for="product in products" :key="product.id" class="py-3 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <img :src="getMediaThumbnailUrl(product.media?.[0])" class="w-10 h-10 rounded-md object-cover bg-gray-100 dark:bg-neutral-800" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">{{ product.title }}</p>
              <p class="text-xs text-gray-500 dark:text-neutral-400">{{ product.status }}</p>
            </div>
          </div>
          <button @click="$emit('promote', product)" class="px-4 py-1.5 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-light transition-colors shrink-0">
            Promote
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSupabaseClient } from '#imports';
import { useUserStore } from '~/stores';
import type { IProduct } from '~/models';
import { getMediaThumbnailUrl } from '~/utils/formatters';
import { notify } from '@kyvg/vue3-notification';

defineProps<{
  products: IProduct[];
}>();

defineEmits(['promote']);

const supabase = useSupabaseClient();
const userStore = useUserStore();
const isLoading = ref(false);

/**
 * Checks if a user has already linked a specific social provider.
 */
const isConnected = (provider: 'facebook' | 'twitter') => {
  return userStore.user?.identities?.some(identity => identity.provider === provider);
};

/**
 * Kicks off the Supabase OAuth flow to link a social account.
 */
const connect = async (provider: 'facebook' | 'twitter') => {
  isLoading.value = true;
  
  let scopes = '';
  if (provider === 'facebook') {
    // These are the permissions we need to post to an Instagram Business Account
    scopes = 'pages_show_list,pages_manage_posts,instagram_basic,instagram_content_publish';
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      // This tells Supabase to link to the *current* user
      // instead of creating a new one.
      scopes: scopes,
      // This brings the user right back to the dashboard.
      redirectTo: window.location.href,
    }
  });

  if (error) {
    notify({ type: 'error', text: error.message });
    isLoading.value = false;
  }
  // If successful, the user is redirected, so no 'finally' is needed
};
</script>

<style scoped>
.form-section { 
  @apply p-6 border rounded-lg bg-white dark:bg-neutral-950 shadow-sm border-gray-200 dark:border-neutral-800; 
}
.section-title { 
  @apply text-lg font-semibold text-gray-800 dark:text-neutral-100 mb-2; 
}
.social-connect-btn {
  @apply flex-1 p-3 rounded-lg bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50;
}
.social-connected-badge {
  @apply flex-1 p-3 rounded-lg bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 flex items-center justify-center gap-2 text-sm font-medium text-green-700 dark:text-green-300;
}
</style>