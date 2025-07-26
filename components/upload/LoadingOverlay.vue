<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="flex flex-col items-center">
      <Icon class="animate-spin" name="mingcute:loading-line" size="60" color="#FFFFFF" />
      <p class="mt-4 text-white font-medium">Processing...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});
</script>