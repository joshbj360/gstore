<template>
  <div>
    <h2 class="text-lg font-medium mb-4">AI Product Enhancement</h2>
    <div class="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <select v-model="selectedProduct" class="border rounded-lg p-2">
        <option value="">Select a product</option>
        <option v-for="product in products" :key="product.id" :value="product.id">{{ product.title }}</option>
      </select>
      <button
        @click="enhanceProduct"
        class="bg-[#C42B78] text-white px-4 py-2 rounded-lg hover:bg-[#C42B78]/80"
        :disabled="!selectedProduct || loading"
      >
        {{ loading ? 'Enhancing...' : 'Enhance with AI' }}
      </button>
      <div v-if="aiResult" class="mt-4 p-4 bg-gray-50 rounded-lg">
        <p><strong>Description:</strong> {{ aiResult.description }}</p>
        <p><strong>Tags:</strong> {{ aiResult.tags.join(', ') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ products: any[] }>();
const emit = defineEmits(['update']);
const selectedProduct = ref('');
const aiResult = ref(null);
const loading = ref(false);

const enhanceProduct = async () => {
  if (!selectedProduct.value) return;
  loading.value = true;
  try {
    const product = props.products.find(p => p.id === selectedProduct.value);
    const response = await $fetch('/api/ai/enhance', {
      method: 'POST',
      body: { title: product.title, description: product.description },
    });
    aiResult.value = response;
    emit('update');
  } catch (err) {
    console.error('AI enhancement error:', err);
  } finally {
    loading.value = false;
  }
};
</script>