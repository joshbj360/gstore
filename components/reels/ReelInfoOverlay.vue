<template>
    <div class="flex-1 min-w-0">
        <!-- 
            1. AUTHOR INFO 
            This section is now universal. It works for both Buyers and Sellers
            because the API provides a standardized `author` object.
        -->
        <NuxtLink :to="authorLink" class="flex items-center gap-3 mb-2">
            <img v-if="item.author?.username" :src="item.author?.avatar || `${formatAvatarUrl(item.author.username)}`" alt="Author" class="w-10 h-10 rounded-full border-2 border-white/80" />
            <div>
                <span class="text-sm font-semibold">{{ item.author?.username || 'A User' }}</span>
                <!-- We can add a badge to differentiate -->
                <span v-if="item.type === 'POST'" class="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Buyer Post
                </span>
            </div>
        </NuxtLink>

        <!-- 
            2. CAPTION / TITLE 
            This is now a computed property that shows the caption or title.
        -->
        <h3 class="font-semibold mb-2 line-clamp-2">{{ caption }}</h3>
        
        <!-- 
            3. "SHOP NOW" BUTTON
            This is now a computed property that links to the correct product,
            whether it's the post's *tagged product* or the post *is* the product.
        -->
        <NuxtLink v-if="shopTarget" :to="`/product/${shopTarget.slug}`" class="inline-block px-6 py-3 bg-white text-black rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform">
            Shop Now - {{ formatPrice(shopTarget?.price || 0) }}
        </NuxtLink>
        <p v-else class="text-sm text-neutral-400">Just sharing a look!</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatPrice } from '~/utils/formatters';
import type { IReel, IProduct } from '~/models'; // Use your IReel/IFeedItem interface

// THE FIX: The component now accepts a single `item` prop.
const props = defineProps<{
    item: IReel;
}>();

/**
 * Computes the correct link for the author.
 * If it's a PRODUCT post, it links to the seller's profile.
 * If it's a BUYER post, it links to the buyer's profile.
 */
const authorLink = computed(() => {
    if (props.item.type === 'PRODUCT' && props.item.product?.seller) {
        return `/seller/profile/${props.item.product.seller.store_slug}`;
    }
    // Fallback for POSTs or mis-configured products
    return `/profile/${props.item.author.username}`;
});

/**
 * Computes the correct caption to display.
 */
const caption = computed(() => {
    return props.item.caption || 'Featured Look';
});

/**
 * Computes the correct product to link for the "Shop Now" button.
 */
const shopTarget = computed<Partial<IProduct> | null>(() => {
    if (props.item.type === 'PRODUCT') {
        return props.item.product;
    }
    if (props.item.type === 'POST' || props.item.type === 'STORY') {
        // Returns the first tagged product, or null if none are tagged
        return props.item.product || null;
    }
    return null;
});
</script>

