<template>
    <transition
        enter-active-class="transition-opacity duration-300 ease-out"
        leave-active-class="transition-opacity duration-300 ease-in"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
    >
        <div v-if="isOpen" class="fixed inset-0 bg-black/60 z-40" @click="$emit('close')"></div>
    </transition>
    
    <transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in"
        enter-from-class="translate-y-full sm:translate-y-0 sm:opacity-0"
        leave-to-class="translate-y-full sm:translate-y-0 sm:opacity-0"
    >
        <div 
            v-if="isOpen" 
            class="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-w-md w-full z-50" 
            role="dialog" 
            aria-modal="true"
        >
            <div @click.stop class="bg-white dark:bg-neutral-900 w-full sm:rounded-lg shadow-xl flex flex-col">
                <!-- Modal Header -->
                <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-neutral-800 shrink-0">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-neutral-100">Create</h3>
                    <button @click="$emit('close')" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
                        <Icon name="mdi:close" size="20" class="text-gray-600 dark:text-neutral-300" />
                    </button>
                </div>
                
                <!-- 
                  Content Area
                -->
                <div class="p-6 space-y-4">
                    <!-- 
                      THE FIX: This is now a <button> that emits 'open-product-modal',
                      instead of a <NuxtLink> that navigates to a new page.
                    -->
                    <button
                        v-if="userStore.isSeller"
                        @click="$emit('open-product-modal')"
                        class="flex items-center w-full p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <Icon name="mdi:package-variant-plus" size="24" class="text-green-500" />
                        <div class="ml-4 text-left">
                            <p class="font-semibold text-gray-800 dark:text-neutral-100">Product</p>
                            <p class="text-sm text-gray-600 dark:text-neutral-400">List a new item in your shop (Quick Add).</p>
                        </div>
                    </button>
                    
                    <!-- "Create Post" (Buyer & Seller) -->
                    <button @click="$emit('open-post-modal')" class="flex items-center w-full p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                        <Icon name="mdi:image-multiple" size="24" class="text-brand" />
                        <div class="ml-4 text-left">
                            <p class="font-semibold text-gray-800 dark:text-neutral-100">Post</p>
                            <p class="text-sm text-gray-600 dark:text-neutral-400">Share a permanent photo or video to your profile.</p>
                        </div>
                    </button>
                    
                    <!-- "Add Story" (Buyer & Seller) -->
                    <button @click="$emit('open-story-modal')" class="flex items-center w-full p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                        <Icon name="mdi:plus-circle-outline" size="24" class="text-blue-500" />
                        <div class="ml-4 text-left">
                            <p class="font-semibold text-gray-800 dark:text-neutral-100">Story</p>
                            <p class="text-sm text-gray-600 dark:text-neutral-400">Share a photo or video that disappears in 24 hours.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores';

const userStore = useUserStore();

defineProps<{ isOpen: boolean }>();
// THE FIX: Added 'open-product-modal' to the emits
defineEmits(['close', 'open-post-modal', 'open-story-modal', 'open-product-modal']);
</script>

