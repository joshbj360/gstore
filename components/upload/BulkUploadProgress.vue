<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Bulk Upload in Progress</h3>
        <button @click="$emit('cancel')" class="text-gray-400 hover:text-gray-500">
          <Icon name="mdi:close" size="20" />
        </button>
      </div>
      
      <div class="mb-2 flex justify-between text-sm text-gray-600">
        <span>Processing...</span>
        <span>{{ progress }}%</span>
      </div>
      
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          class="bg-[#C42B78] h-2.5 rounded-full" 
          :style="`width: ${progress}%`"
        ></div>
      </div>
      
      <p class="mt-4 text-sm text-gray-500">
        Please don't close this window while your products are being uploaded.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  progress: {
    type: Number,
    default: 0
  }
});

defineEmits(['cancel']);
</script>