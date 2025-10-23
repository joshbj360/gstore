<template>
    <div class="space-y-4">
        <h3 class="font-bold text-neutral-300 mb-2">Featured Shops</h3>
        <div 
            v-for="seller in topSellers" 
            :key="seller.id"
            class="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors"
            @click="navigateToSeller(seller.store_slug)"
        >
            <img 
                :src="seller.store_logo || 'https://picsum.photos/80/80'" 
                alt="Seller"
                class="w-8 h-8 rounded-full object-cover" 
            />
            <div>
                <p class="text-sm font-medium text-neutral-100">{{ seller.store_name }}</p>
                <p class="text-xs text-neutral-400">{{ seller._count?.products }} items</p>
            </div>
        </div>

        <hr class="my-4 border-neutral-800">

        <h3 class="font-bold text-neutral-300 mb-2">Categories</h3>
        <div class="space-y-1">
            <!-- Use NuxtLink for proper navigation -->
            <NuxtLink 
                v-for="category in categories" 
                :key="category.id"
                :to="`/category/${category.slug}`" 
                class="block text-sm text-neutral-300 cursor-pointer hover:text-[#f02c56] px-2 py-1 rounded transition-colors"
            >
                <img 
                    :src="category.thumbnailCatUrl || 'https://picsum.photos/20/20'" 
                    alt="Category Icon" 
                    class="inline-block w-5 h-5 mr-2 object-cover" 
                />
                {{ category.name }}
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { ICategory, ISellerProfile } from '~/models';

const router = useRouter();

const props = defineProps<{
    categories: ICategory[];
    topSellers: ISellerProfile[];
}>();

const navigateToSeller = (slug: string) => {
    if (slug) {
        router.push(`/seller/profile/${slug}`);
    }
};
</script>
