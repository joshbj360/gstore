<template>
    <div id="product-card"
        class="relative bg-white rounded-lg shadow-sm overflow-hidden group transition-all duration-300 hover:shadow-lg">

        <!-- LIKE & SHARE BUTTONS -->
        <div class="absolute top-2 right-2 z-20 flex gap-2">
            <button @click.stop="likeStore.toggleProductLike(product.id!)"
                class="h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-brand transition-colors"
                aria-label="Like Product">
                <Icon :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" size="20"
                    :class="{ 'text-brand': isLiked }" />
            </button>
            <button @click.stop="shareProduct"
                class="h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-brand transition-colors"
                aria-label="Share Product">
                <Icon name="mdi:share-variant" size="20" />
            </button>
        </div>

        <!-- Product Image -->
        <NuxtLink :to="`/product/${product.slug}`" class="block w-full aspect-square relative overflow-hidden">
            <MediaDisplayCard :product-media="product.media?.[0]"
                class="w-full h-full transition-transform duration-300 group-hover:scale-105" />
        </NuxtLink>

        <!-- Product details -->
        <div class="p-3 flex flex-col flex-1">
            <div class="flex items-center gap-2 mb-2">
                <NuxtLink :to="`/seller/profile/${product.seller?.store_slug}`" class="flex-shrink-0">
                    <img :src="product.seller?.store_logo || '/default-store-logo.png'"
                        class="w-6 h-6 rounded-full object-cover">
                </NuxtLink>
                <div class="flex-1 min-w-0">
                    <NuxtLink :to="`/seller/profile/${product.seller?.store_slug}`"
                        class="text-xs font-semibold text-gray-700 hover:underline truncate">
                        {{ product.seller?.store_name || 'Unknown Seller' }}
                    </NuxtLink>
                </div>
            </div>

            <div class="flex-grow flex flex-col justify-between">
                <div>
                    <h3 class="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight h-10">{{ product.title }}
                    </h3>
                    <div class="flex justify-between items-center mt-1">
                        <div class="flex items-baseline gap-2">
                            <p class="text-base font-bold text-gray-800">{{ formatPrice(product.price) }}</p>
                        </div>
                        <div class="relative">
                            <div class="flex space-x-2">
                                <!-- Add to Cart Button -->
                                <button @click.stop="handleAddToCartClick" class="flex items-center gap-1 text-sm font-medium transition-all duration-200
                                    md:bg-brand md:text-white md:px-3 md:py-1 md:rounded-lg
                                    text-brand hover:text-brand-dark">
                                    <!-- Text shows only on md and above -->
                                    <span class="hidden md:inline">Bag it!</span>

                                    <!-- Icon always visible -->
                                    <Icon name="mdi:shopping" class="w-5 h-5 pb-5" />
                                </button>

                                <!-- AI Chat Button -->
                                <button v-if="product" @click.stop
                                    class="p-1 text-brand hover:text-brand-dark transition-colors" title="Chat with AI">
                                    <Icon name="mdi:robot" class="w-5 h-5 pt-2" />
                                </button>


                            </div>
                            <transition enter-active-class="transition-all duration-200 ease-out"
                                leave-active-class="transition-all duration-200 ease-in"
                                enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0 translate-y-2">
                                <div v-if="showVariantSelector" v-click-outside="() => showVariantSelector = false"
                                    class="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-2xl border w-36 max-h-48 flex flex-col z-30">
                                    <p class="text-xs font-semibold text-gray-500 px-2 py-1.5 border-b shrink-0">Select
                                        a Size</p>
                                    <div class="mt-1 space-y-1 p-1 overflow-y-auto">
                                        <button v-for="variant in product.variants" :key="variant.id"
                                            @click="selectVariant(variant)" :disabled="variant.stock === 0"
                                            class="w-full text-left px-2 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:line-through">
                                            {{ variant.size }}
                                        </button>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>
                </div>

                <div v-if="(product.likes?.length || 0) > 0 || (product.soldCount || 0) > 0"
                    class="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div class="flex items-center gap-1.5">
                        <Icon name="mdi:heart-outline" class="h-4 w-4 text-rose-400" />
                        <span>{{ likeCountFormatted }} Likes</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <Icon name="mdi:package-variant-closed" class="h-4 w-4 text-gray-400" />
                        <span>{{ numberSoldFormatted }} Sold</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCartStore, useUserStore, useLikeStore } from '~/stores';
import type { IProduct, IProductVariant } from '~/models/interface/';
import MediaDisplayCard from './MediaDisplayCard.vue';
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

const likeCountFormatted = computed(() => {
    const baseLikes = props.product.likes?.length || 0;
    if (likeStore.likedProductIds.has(props.product.id!)) {
        const otherLikes = props.product.likes?.filter(l => l.userId !== userStore.user?.id).length || 0;
        return Math.max(baseLikes, otherLikes + 1);
    }
    return baseLikes;
});

const numberSoldFormatted = computed(() => {
    const count = props.product.soldCount || 0;
    if (count > 999) return `${(count / 1000).toFixed(1)}k+`;
    return count.toString();
});

const handleAddToCartClick = () => {
    const variants = props.product.variants;
    if (variants && variants.length > 1) {
        // Toggle the pop-up visibility
        showVariantSelector.value = !showVariantSelector.value;
    } else if (variants && variants.length === 1) {
        // If there's only one size, add it directly
        cartStore.addToCart(props.product, variants[0]);
        notify({ type: 'success', text: `${props.product.title} added to cart!` });
    } else {
        notify({ type: 'error', text: 'This product is currently unavailable.' });
    }
};

const selectVariant = (variant: IProductVariant) => {
    cartStore.addToCart(props.product, variant);
    notify({ type: 'success', text: `${props.product.title} (${variant.size}) added to cart!` });
    showVariantSelector.value = false; // Close the pop-up after selection
};

const shareProduct = async () => {
    const shareUrl = `${window.location.origin}/product/${props.product.slug}`
    try {
        if (navigator.share) {
            await navigator.share({ url: shareUrl, title: props.product.title })
        } else {
            await navigator.clipboard.writeText(shareUrl)
            notify({ type: 'success', text: 'Link copied to clipboard!' })
        }
    } catch (error) {
        notify({ type: 'error', text: 'Failed to share product.' })
    }
}

// Custom directive for clicking outside
const vClickOutside = {
    beforeMount: (el: any, binding: any) => {
        el.clickOutsideEvent = (event: MouseEvent) => {
            // Check that the click was outside the element and its children
            if (!(el === event.target || el.contains(event.target))) {
                // If it was, call the function provided in the directive's value
                binding.value();
            }
        };
        document.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted: (el: any) => {
        document.removeEventListener('click', el.clickOutsideEvent);
    },
};
</script>
