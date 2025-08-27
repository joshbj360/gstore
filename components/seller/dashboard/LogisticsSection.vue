<template>
  <div>
    <h2 class="text-lg font-medium mb-4">Logistics Settings</h2>
    <div class="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <TextInput v-model:input="shippingRate" label="Flat Shipping Rate ($)" type="number" placeholder="10.00" />
      <button class="bg-[#C42B78] text-white px-4 py-2 rounded-lg hover:bg-[#C42B78]/80">
        Save Logistics
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import TextInput from '~/components/shared/TextInput.vue';
import { ref } from 'vue';

const shippingRate = ref('10.00');
</script>