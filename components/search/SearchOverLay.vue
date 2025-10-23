<template>
    <transition enter-active-class="transition-opacity duration-300 ease-out" leave-active-class="transition-opacity duration-300 ease-in" enter-from-class="opacity-0" leave-to-class="opacity-0">
        <div v-if="isVisible" class="fixed inset-0 bg-neutral-950 z-30 p-4 flex flex-col">
            <div class="flex items-center gap-2 mb-4">
                <button @click="$emit('close')" class="p-2 -ml-2 text-neutral-300 hover:text-white">
                    <Icon name="mdi:arrow-left" size="24" />
                </button>
                <div class="flex-1">
                    <SearchBar @open-ai-chat="(query: any) => $emit('open-ai-chat', query)" />
                </div>
            </div>
            <!-- Results will show inside the SearchBar component -->
        </div>
    </transition>
</template>

<script setup lang="ts">
import SearchBar from './SearchBarWithAI.vue';

defineProps<{ isVisible: boolean }>();
defineEmits(['close', 'open-ai-chat']);
</script>

