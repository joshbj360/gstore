<template>
    <div id="product-card" class="bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-neutral-800 transition-all duration-300 hover:shadow-lg">
        
        <button 
            @click.stop="likeStore.toggleProductLike(product.id!)"
            class="absolute top-2 right-2 z-20 h-8 w-8 bg-white/80 dark:bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 dark:text-white hover:text-brand transition-colors"
            aria-label="Like Product"
        >
            <Icon :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" size="20" :class="{ 'text-brand': isLiked }" />
        </button>

        <NuxtLink :to="`/product/${product.slug}`" class="block w-full aspect-square relative overflow-hidden group bg-gray-100 dark:bg-neutral-800">
            <img 
                :src="getMediaThumbnailUrl(product.media?.[0])" 
                :alt="product.title" 
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div v-if="product.media?.[0]?.type === 'VIDEO'" class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="mdi:play-circle-outline" size="48" class="text-white" />
            </div>
        </NuxtLink>

        <div class="p-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-100 line-clamp-2 leading-tight h-10">{{ product.title }}</h3>
            
            <div class="flex justify-between items-center mt-1">
                <p class="text-base font-bold text-gray-900 dark:text-neutral-100">{{ formatPrice(product.price) }}</p>

                <div class="relative">
                    <button 
                        @click.stop="handleAddToCartClick"
                        class="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-brand hover:text-white text-gray-700 dark:text-neutral-300 dark:hover:text-white transition-colors"
                        aria-label="Add to cart"
                    >
                        <Icon name="mdi:cart-plus" class="h-5 w-5" />
                    </button>

                    <transition
                        enter-active-class="transition-all duration-200 ease-out"
                        leave-active-class="transition-all duration-200 ease-in"
                        enter-from-class="opacity-0 translate-y-2"
                        leave-to-class="opacity-0 translate-y-2"
                    >
                        <div v-if="showVariantSelector" v-click-outside="() => showVariantSelector = false" 
                             class="absolute bottom-full mb-2 right-0 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-gray-200 dark:border-neutral-700 w-36 max-h-48 flex flex-col z-30">
                            <p class="text-xs font-semibold text-gray-500 dark:text-neutral-400 px-2 py-1.5 border-b border-gray-200 dark:border-neutral-700 shrink-0">Select Size</p>
                            <div class="mt-1 space-y-1 p-1 overflow-y-auto">
                                <button 
                                    v-for="variant in product.variants" 
                                    :key="variant.id" 
                                    @click="selectVariant(variant)"
                                    :disabled="variant.stock === 0"
                                    class="w-full text-left px-2 py-1.5 text-sm font-medium rounded-md text-gray-800 dark:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:line-through"
                                >
                                    {{ variant.size }}
                                </button>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCartStore, useUserStore, useLikeStore } from '~/stores';
import type { IProduct, IProductVariant } from '~/models/interface/';
import { formatPrice } from '~/utils/formatters';
import { getMediaThumbnailUrl } from '~/utils/formatters';
import { notify } from "@kyvg/vue3-notification";
import { useRouter } from 'vue-router';

const props = defineProps<{
    product: IProduct;
}>();

const cartStore = useCartStore();
const userStore = useUserStore();
const likeStore = useLikeStore();
const router = useRouter();

const showVariantSelector = ref(false);

const isLiked = computed(() => likeStore.likedProductIds.has(props.product.id!));

const handleAddToCartClick = () => {
    const variants = props.product.variants;
    if (variants && variants.length > 1) {
        showVariantSelector.value = !showVariantSelector.value;
    } else if (variants && variants.length === 1) {
        cartStore.addToCart(props.product, variants[0]);
        notify({ type: 'success', text: `${props.product.title} added to cart!` });
    } else {
        notify({ type: 'error', text: 'This product is currently unavailable.' });
    }
};

const selectVariant = (variant: IProductVariant) => {
    cartStore.addToCart(props.product, variant);
    notify({ type: 'success', text: `${props.product.title} (${variant.size}) added to cart!` });
    showVariantSelector.value = false;
}; 

// --- REDUNDANT DIRECTIVE REMOVED ---
// The v-click-outside directive is now provided globally
// by plugins/click-outside.client.ts 
</script>