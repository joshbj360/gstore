<template>
  <transition
    enter-active-class="transition-opacity duration-300 ease-out"
    leave-active-class="transition-opacity duration-300 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 bg-black/60 z-40" @click="$emit('close')"></div>
  </transition>
  
  <transition
    enter-active-class="transition-transform duration-300 ease-out"
    leave-active-class="transition-transform duration-300 ease-in"
    enter-from-class="translate-y-full sm:translate-y-0 sm:opacity-0"
    leave-to-class="translate-y-full sm:translate-y-0 sm:opacity-0"
  >
    <div v-if="isOpen" class="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-w-xl w-full z-50">
      <div @click.stop class="bg-white dark:bg-neutral-900 w-full max-h-[85vh] sm:rounded-lg shadow-xl flex flex-col">
        <!-- Modal Header -->
        <header class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-neutral-800 shrink-0">
          <h1 class="font-semibold text-gray-900 dark:text-neutral-100">Create Social Post</h1>
          <button @click="$emit('close')" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
              <Icon name="mdi:close" size="20" class="text-gray-600 dark:text-neutral-300" />
          </button>
        </header>

        <!-- Scrollable Content -->
        <main class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Product Preview -->
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
            <img :src="getMediaThumbnailUrl(product.media?.[0])" class="w-12 h-12 rounded-md object-cover" />
            <div>
              <p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">{{ product.title }}</p>
              <p class="text-xs text-gray-500 dark:text-neutral-400">Promoting this product.</p>
            </div>
          </div>

          <!-- SocialSync Component Logic -->
          <SocialSync 
            :product-info="product"
            @update:captions="handleCaptionsUpdate"
          />
        </main>

        <!-- Footer -->
        <footer class="p-4 border-t border-gray-200 dark:border-neutral-800 shrink-0 flex justify-end">
          <button 
            @click="publishPost" 
            :disabled="isSubmitting" 
            class="px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-light disabled:opacity-50"
          >
            <Icon v-if="isSubmitting" name="eos-icons:loading" class="mr-2" />
            {{ isSubmitting ? 'Publishing...' : 'Publish to Socials' }}
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useApiService } from '~/services/api/apiService';
import { notify } from '@kyvg/vue3-notification';
import type { IProduct } from '~/models';
import { getMediaThumbnailUrl } from '~/utils/formatters';
import SocialSync from '~/components/upload/SocialSync.vue'; // We re-use your new component

const props = defineProps<{
  isOpen: boolean;
  product: IProduct;
}>();

const emit = defineEmits(['close', 'posted']);

const apiService = useApiService();
const isSubmitting = ref(false);
const generatedCaptions = ref<Record<string, string>>({});

const handleCaptionsUpdate = (captions: Record<string, string>) => {
  generatedCaptions.value = captions;
};

const publishPost = async () => {
  isSubmitting.value = true;
  try {
    const postPromises = [];
    for (const [platformId, caption] of Object.entries(generatedCaptions.value)) {
      if (caption) {
        postPromises.push(
          apiService.postToSocial({
            platform: platformId,
            caption: caption,
            mediaUrl: props.product.media![0].url,
            productUrl: `${useRuntimeConfig().public.baseURL}/product/${props.product.slug}`
          })
        );
        notify({ type: 'info', text: `Posting to ${platformId}...` });
      }
    }

    if (postPromises.length === 0) {
      notify({ type: 'warn', text: 'No captions generated or platforms selected.' });
      isSubmitting.value = false;
      return;
    }

    await Promise.all(postPromises);
    emit('posted');

  } catch (e: any) {
    notify({ type: 'error', text: e.message || 'Publication failed.' });
  } finally {
    isSubmitting.value = false;
  }
};
</script>