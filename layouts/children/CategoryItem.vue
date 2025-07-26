<template>
  <div class="flex items-center hover:bg-gray-100 rounded-md w-full py-1.5 px-2 cursor-pointer transition-all duration-300">
    <img
      :src="imgUri"
      :alt="altIcon || category"
      class="rounded-full h-7 w-7 mr-2 object-cover"
    >
    <span class="lg:block hidden font-semibold text-sm text-gray-700">
      {{ category }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';

const props = defineProps<{
  category: string;
  imgUri: string;
  altIcon?: string;
}>();

const { category, imgUri, altIcon } = toRefs(props);
</script>
