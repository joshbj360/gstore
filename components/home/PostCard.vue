<template>
    <div class="bg-neutral-950 rounded-xl shadow-md overflow-hidden border border-neutral-800">
        <!-- Seller Header -->
        <div class="flex items-center p-3">
            <NuxtLink :to="`/seller/profile/${product.seller?.store_slug}`" class="flex items-center gap-3">
                <img :src="product.seller?.store_logo || '/default-avatar.png'" class="w-10 h-10 rounded-full object-cover">
                <span class="font-semibold text-sm">{{ product.seller?.store_name }}</span>
                <Icon v-if="product.seller?.is_verified" name="mdi:check-decagram" class="text-blue-500" />
            </NuxtLink>
            <button class="ml-auto text-sm font-semibold text-[#f02c56] hover:underline">Follow</button>
        </div>

        <!-- 
            THE FIX: Product Media Carousel
            - Changed `aspect-square` to `aspect-video` (16:9).
            - Replaced `<img>` with the new `FeedMediaDisplay` component.
        -->
        <div class="relative aspect-video bg-neutral-800 cursor-pointer" @click="$emit('open-details', product)">
            <Carousel v-if="product.media?.length" :items-to-show="1" wrap-around>
                <Slide v-for="media in product.media" :key="media.id">
                    <FeedMediaDisplay :media="media" :alt-text="product.title" class="w-full h-full" />
                </Slide>
                <!-- We've kept the Pagination component here, but it will be hidden by our new CSS rule -->
                <template #addons><Pagination /></template>
            </Carousel>
        </div>

        <!-- Actions & Info -->
        <div class="p-4">
            <!-- Action Buttons -->
            <div class="flex items-center space-x-4 mb-3">
                <button @click="likeStore.toggleProductLike(product.id!)">
                    <Icon :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" class="w-7 h-7" :class="isLiked ? 'text-red-500' : ''" />
                </button>
                <button @click="$emit('open-comments', product)">
                    <Icon name="mdi:comment-text-outline" class="w-7 h-7" />
                </button>
                <button @click="shareProduct">
                    <Icon name="mdi:share-variant-outline" class="w-7 h-7" />
                </button>
                
                <button @click.stop="handleAddToCart" class="ml-auto p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                    <Icon name="mdi:cart-plus" class="w-6 h-6" />
                </button>
                <div class="flex-1"></div>
                
                <button @click.stop="$emit('open-details', product)" title="Product details...">
                    <Icon name="mdi:dots-horizontal-circle-outline" class="w-7 h-7" />
                </button>
            </div>
            
            <!-- Likes and Price -->
            <div class="text-sm">
                <p class="font-semibold">{{ product._count?.likes || 0 }} likes</p>
                <p class="font-bold text-lg">{{ formatPrice(product.price) }}</p>
                <p>
                    <span class="font-semibold">{{ product.seller?.store_name }}</span>
                    <span class="text-neutral-400 ml-2 line-clamp-1">{{ product.title }}</span>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLikeStore, useCartStore } from '~/stores';
import type { IProduct, IProductVariant } from '~/models';
import { formatPrice } from '~/utils/formatters';
import 'vue3-carousel/dist/carousel.css';
import { notify } from '@kyvg/vue3-notification';
import FeedMediaDisplay from '~/components/home/FeedMediaDisplay.vue'; // Import the new component

const props = defineProps<{ product: IProduct }>();
const emit = defineEmits(['open-comments', 'open-details']);

const likeStore = useLikeStore();
const cartStore = useCartStore();

const isLiked = computed(() => likeStore.likedProductIds.has(props.product.id!));

const handleAddToCart = () => {
    const variants = props.product.variants;
    if (variants && variants.length > 1) {
        emit('open-details', props.product);
    } else if (variants && variants.length === 1) {
        cartStore.addToCart(props.product, variants[0]);
        notify({ type: 'success', text: `${props.product.title} added to cart!` });
    } else {
        notify({ type: 'error', text: 'This product is currently unavailable.' });
    }
};

const shareProduct = () => { /* ... share logic ... */ };
</script>

<style scoped>
/* Scoped styles for dark-theme carousel pagination */
:deep(.carousel__pagination-button) {
    background-color: rgba(120, 120, 120, 0.5) !important;
}
:deep(.carousel__pagination-button--active) {
    background-color: rgba(255, 255, 255, 0.9) !important;
}

/* THE FIX: This rule hides the pagination dots completely */
:deep(.carousel__pagination) {
  display: none;
}
</style>

