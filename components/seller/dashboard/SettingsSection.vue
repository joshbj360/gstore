<template>
  <div>
    <h2 class="text-lg font-medium mb-4">Store Settings</h2>
    <div class="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <TextInput v-model:input="storeName" label="Store Name" placeholder="Your store name" />
      <TextInput v-model:input="storeEmail" label="Store Email" type="email" placeholder="store@example.com" />
      <button class="bg-[#f02c56] text-white px-4 py-2 rounded-lg hover:bg-[#f02c56]/80">
        Save Settings
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import TextInput from '~/components/shared/TextInput.vue';
import { ref } from 'vue';

const storeName = ref('');
const storeEmail = ref('');
</script>