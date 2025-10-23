<template>
    <!-- Use a separate transition for the overlay and the content for a cleaner slide-up effect -->
    <transition
        enter-active-class="transition-opacity duration-300 ease-out"
        leave-active-class="transition-opacity duration-300 ease-in"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
    >
        <div v-if="product" class="fixed inset-0 bg-black/60 z-40" @click="$emit('close')"></div>
    </transition>
    
    <transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in"
        enter-from-class="translate-y-full"
        leave-to-class="translate-y-full"
    >
        <div 
            v-if="product" 
            class="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-w-2xl w-full z-50" 
            role="dialog" 
            aria-modal="true"
        >
            <div @click.stop class="bg-neutral-900 w-full max-h-[85vh] sm:rounded-lg shadow-xl flex flex-col">
                <!-- Modal Header -->
                <div class="flex items-center justify-between p-3 border-b border-neutral-800 shrink-0">
                    <h3 class="text-sm font-semibold text-neutral-200">Product Details</h3>
                    <button @click="$emit('close')" class="p-2 rounded-full hover:bg-neutral-800">
                        <Icon name="mdi:close" size="20" class="text-neutral-300" />
                    </button>
                </div>
                
                <!-- Scrollable Content Area -->
                <div class="flex-1 overflow-y-auto">
                    <!-- 
                        As you requested, the redundant media carousel is removed.
                        We now *only* show the details, variants, and purchase actions.
                    -->
                    <ProductDetails 
                        v-if="product.seller"
                        :product="product" 
                        :sellerStore="product.seller" 
                    />
                    <div v-else class="p-4 text-center text-neutral-400">Loading details...</div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import type { IProduct } from '~/models';
// We are re-using the same detailed info component from the desktop sidebar
import ProductDetails from '~/components/product/productDetails/productDetails/children/ProductDetails.vue';

defineProps<{ product: IProduct | null }>();
defineEmits(['close']);
</script>

