<template>
  <div class="p-6 border rounded-lg bg-white shadow-sm">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Share on Social Media</h3>
    <div class="space-y-4">
      <textarea v-model="postContent" class="w-full p-2 border rounded" rows="4"></textarea>
      <div class="flex justify-end space-x-2">
        <button @click="postTo('facebook')" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          <Icon name="mdi:facebook" class="mr-1" />
          Share on Facebook
        </button>
        <button @click="postTo('twitter')" class="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600">
          <Icon name="mdi:twitter" class="mr-1" />
          Tweet
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ProductInterface } from '~/models/interface/products/product.interface';

const props = defineProps<{
  product: ProductInterface;
}>();

const postContent = ref('');

onMounted(() => {
  postContent.value = `Check out our new product: ${props.product.title}! ${props.product.description?.substring(0, 100)}... #product #new`;
});

const postTo = (platform: string) => {
  // This is a placeholder for the actual API call to post to the social media platform.
  alert(`Posting to ${platform}: ${postContent.value}`);
};
</script>
