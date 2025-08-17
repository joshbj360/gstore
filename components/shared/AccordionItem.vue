<template>
  <div class:="border-b border-gray-200">
    <button
      @click="isOpen = !isOpen"
      class="w-full flex justify-between items-center py-4 text-left"
    >
      <span class="font-medium text-gray-800">{{ title }}</span>
      <Icon 
        name="mdi:chevron-down" 
        class="transition-transform duration-300"
        :class="{ 'transform rotate-180': isOpen }"
      />
    </button>
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 -translate-y-2 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-screen"
      leave-from-class="opacity-100 translate-y-0 max-h-screen"
      leave-to-class="opacity-0 -translate-y-2 max-h-0"
    >
      <div v-if="isOpen" class="pb-4 prose prose-sm max-w-none text-gray-600">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  startOpen?: boolean;
}>();

const isOpen = ref(props.startOpen || false);
</script>