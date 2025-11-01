<template>
  <!-- Instagram-style Search Panel -->
  <transition
    enter-active-class="transition-transform duration-300 ease-out"
    leave-active-class="transition-transform duration-200 ease-in"
    enter-from-class="-translate-x-full"
    leave-to-class="-translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed top-0 left-0 h-full z-30 flex"
      role="dialog"
      aria-modal="true"
    >
      <div
        @click.stop
        class="bg-white dark:bg-neutral-900 w-screen sm:w-96 shadow-xl flex flex-col border-r border-gray-200 dark:border-neutral-800"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-neutral-100">
            Search
          </h2>
          <button
            @click="$emit('close')"
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Icon
              name="mdi:close"
              size="22"
              class="text-gray-600 dark:text-neutral-300"
            />
          </button>
        </div>

        <!-- Search Bar -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
          <SearchBar
            @open-ai-chat="(query: string) => $emit('open-ai-chat', query)"
          />
        </div>

        <!-- Search Results -->
        <div class="flex-1 overflow-y-auto p-2">
          <!-- Results from SearchBar.vue appear here -->
        </div>
      </div>

      <!-- Click-outside overlay -->
      <div class="flex-1 bg-black/40 dark:bg-black/60" @click="$emit('close')"></div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import SearchBar from './SearchBarWithAI.vue';

defineProps<{ isOpen: boolean }>();
defineEmits(['close', 'open-ai-chat']);
</script>
