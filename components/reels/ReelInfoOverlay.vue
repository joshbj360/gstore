<template>
    <div class="flex-1 min-w-0">
        <NuxtLink :to="authorLink" class="flex items-center gap-3 mb-2">
            <img v-if="item.author?.username" :src="item.author?.avatar || `${formatAvatarUrl(item.author.username)}`" alt="Author" class="w-10 h-10 rounded-full border-2 border-white/80" />
            <div>
                 <span class="text-sm font-semibold text-white" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">{{ item.author?.username || 'A User' }}</span>
                <span v-if="item.type === 'POST'" class="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Buyer Post
                </span>
            </div>
        </NuxtLink>

        <h3 class="font-semibold mb-2 line-clamp-2 text-white" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">{{ caption }}</h3>
        
        <NuxtLink v-if="shopTarget" :to="`/product/${shopTarget.slug}`" class="inline-block px-6 py-3 bg-white/95 text-black rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform">
            Shop Now - {{ formatPrice(shopTarget?.price || 0) }}
        </NuxtLink>
        <p v-else class="text-sm text-neutral-300" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">Just sharing a look!</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatPrice, formatAvatarUrl } from '~/utils/formatters';
import type { IReel, IProduct } from '~/models'; 

const props = defineProps<{
    item: IReel;
}>();

const authorLink = computed(() => {
    if (props.item.type === 'PRODUCT' && props.item.product?.seller) {
        return `/seller/profile/${props.item.product.seller.store_slug}`;
    }
    return `/profile/${props.item.author.username}`;
});

const caption = computed(() => {
    return props.item.caption || 'Featured Look';
});

const shopTarget = computed<Partial<IProduct> | null>(() => {
    if (props.item.type === 'PRODUCT') {
        return props.item.product;
    }
    if (props.item.type === 'POST' || props.item.type === 'STORY') {
        return props.item.product || null;
    }
    return null;
});
</script>