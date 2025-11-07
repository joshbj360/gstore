<template>
    <!-- 
      THE FIX: Replaced all hardcoded dark classes with 
      light-mode defaults and `dark:` prefixes.
    -->
    <div class="bg-white dark:bg-neutral-950 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-neutral-800">
        <!-- Seller Header -->
        <div class="flex items-center p-3">
            <NuxtLink :to="`/seller/profile/${product.seller?.store_slug}`" class="flex items-center gap-3">
                <img :src="product.seller?.store_logo || '/default-avatar.png'" class="w-10 h-10 rounded-full object-cover">
                <span class="font-semibold text-sm text-gray-800 dark:text-neutral-100">{{ product.seller?.store_name }}</span>
                <Icon v-if="product.seller?.is_verified" name="mdi:check-decagram" class="text-blue-500" />
            </NuxtLink>
            <button @click.stop="followStore.toggleFollow(product.sellerId)" class="ml-auto text-sm font-semibold hover:underline"
                :class="isFollowing ? 'text-gray-500 dark:text-neutral-400' : 'text-brand'">
                {{ isFollowing ? 'Following' : 'Follow' }}
            </button>
        </div>

        <!-- Product Media Carousel -->
        <div class="relative aspect-video bg-gray-100 dark:bg-neutral-800 cursor-pointer" @click="openProductModal">
            <Carousel v-if="product.media?.length" :items-to-show="1" wrap-around>
                <Slide v-for="media in product.media" :key="media.id">
                    <FeedMediaDisplay :media="media" :alt-text="product.title" class="w-full h-full" />
                </Slide>
                <template #addons><Pagination /></template>
            </Carousel>
        </div>

        <!-- Actions & Info -->
        <div class="p-4">
            <!-- Action Buttons -->
            <div class="flex items-center space-x-4 mb-3">
                <button @click.stop="likeStore.toggleProductLike(product.id!)">
                    <Icon :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" class="w-7 h-7" :class="isLiked ? 'text-brand-dark' : 'text-gray-500 dark:text-neutral-300 hover:text-brand-light'" />
                </button>
                <button @click.stop="$emit('open-comments', product)">
                    <Icon name="mdi:comment-text-outline" class="w-7 h-7 text-gray-500 dark:text-neutral-300 hover:text-black dark:hover:text-white" />
                </button>
                <button @click.stop="shareProduct">
                    <Icon name="mdi:share-variant-outline" class="w-7 h-7 text-gray-500 dark:text-neutral-300 hover:text-black dark:hover:text-white" />
                </button>
                
                <button @click.stop="handleAddToCart" class="ml-auto p-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700">
                    <Icon name="mdi:cart-plus" class="w-6 h-6 text-gray-700 dark:text-neutral-300" />
                </button>
                <div class="flex-1"></div>
                <button @click.stop="openProductModal" title="Product details..." class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
                    <Icon name="mdi:dots-horizontal-circle-outline" class="w-7 h-7 text-gray-500 dark:text-neutral-300" />
                </button>
            </div>
            
            <!-- Likes and Price -->
            <div class="text-sm">
                <p class="font-semibold text-gray-800 dark:text-neutral-100">{{ likeCountFormatted }} likes</p>
                <p class="font-bold text-lg text-gray-900 dark:text-neutral-100">{{ formatPrice(product.price) }}</p>
                <p class="text-gray-800 dark:text-neutral-100">
                    <span class="font-semibold">{{ product.seller?.store_name }}</span>
                    <span class="text-gray-600 dark:text-neutral-400 ml-2 line-clamp-1">{{ product.title }}</span>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLikeStore, useCartStore, useUserStore, useFollowStore } from '~/stores';
import type { IProduct, IProductVariant } from '~/models';
import { formatPrice } from '~/utils/formatters';
import 'vue3-carousel/dist/carousel.css';
import { notify } from '@kyvg/vue3-notification';
import FeedMediaDisplay from '~/components/home/FeedMediaDisplay.vue';

const props = defineProps<{ product: IProduct }>();
const emit = defineEmits(['open-comments', 'open-details']);

const likeStore = useLikeStore();
const cartStore = useCartStore();
const userStore = useUserStore();
const followStore = useFollowStore();

// --- STATEFUL COMPUTED PROPERTIES ---
const isLiked = computed(() => likeStore.likedProductIds.has(props.product.id!));
const isFollowing = computed(() => followStore.followedSellerIds.has(props.product.sellerId));

const likeCountFormatted = computed(() => {
    const baseLikes = props.product._count?.likes || 0;
    
    // Check if user's like is already in the base count
    const userLikeInBase = props.product.likes?.some(l => l.userId === userStore.user?.id);

    // Optimistic Update Logic
    if (isLiked.value && !userLikeInBase) {
        return baseLikes + 1; // User just liked, add 1
    }
    if (!isLiked.value && userLikeInBase) {
        return Math.max(0, baseLikes - 1); // User just unliked, subtract 1
    }
    return baseLikes; // No change
});

// --- COMPONENT METHODS ---
const handleAddToCart = () => {
    const variants = props.product.variants;
    if (variants && variants.length > 1) {
        // More than one size, open the details modal
        emit('open-details', props.product);
    } else if (variants && variants.length === 1) {
        // Only one size, add it directly
        console.log(props.product.title, variants[0]) //TODO remove
        cartStore.addToCart(props.product, variants[0]);
        notify({ type: 'success', text: `${props.product.title} added to cart!` });
    } else {

        notify({ type: 'error', text: 'This product is currently unavailable.' });
    }
};

const openProductModal = () => {
    emit('open-details', props.product);
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
</script>

<style scoped>
/* Scoped styles for dark-theme carousel pagination */
:deep(.carousel__pagination-button) {
    background-color: rgba(120, 120, 120, 0.5) !important;
}
:deep(.carousel__pagination-button--active) {
    background-color: rgba(255, 255, 255, 0.9) !important;
}
:deep(.carousel__pagination) {
  display: none;
}
</style>

