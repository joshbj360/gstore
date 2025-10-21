<template>
    <div class="flex-1 min-w-0">
        <NuxtLink :to="`/seller/profile/${seller.store_slug}`" class="flex items-center gap-3 mb-2">
            <img :src="seller.store_logo || '/default-avatar.png'" alt="Seller" class="w-10 h-10 rounded-full border-2 border-white/80" />
            <span class="text-sm font-semibold">{{ seller.store_name }}</span>
        </NuxtLink>
        <h3 class="font-semibold mb-2 line-clamp-2">{{ product?.title || 'Featured Look' }}</h3>
        <NuxtLink v-if="product" :to="`/product/${product.slug}`" class="inline-block px-6 py-3 bg-white text-black rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform">
            Shop Now - {{ formatPrice(product.price) }}
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
import { formatPrice } from '~/utils/formatters';
defineProps(['seller', 'product']);
</script>
