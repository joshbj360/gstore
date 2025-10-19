<template>
    <div class="space-y-4">
                <h3 class="font-bold text-gray-700 mb-2">Featured Shops</h3>
                <div v-for="seller in topSellers" :key="seller.id"
                    class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    @click="navigateToSeller(seller.store_slug)">
                    <img :src="seller.store_logo || 'https://picsum.photos/80/80'" alt="Seller"
                        class="w-8 h-8 rounded-full object-cover" />
                    <div>
                        <p class="text-sm font-medium text-gray-900">{{ seller.store_name }}</p>
                        <p class="text-xs text-gray-500">{{ seller._count?.products }} items</p>
                    </div>
                </div>
                <hr class="my-4 border-gray-200">
                <h3 class="font-bold text-gray-700 mb-2">Categories</h3>
                <div  class="space-y-1">
                    <!-- Use NuxtLink for proper navigation -->
                    <NuxtLink v-for="category in categories" :key="category.id"
                        :to="`/category/${category.slug}`" class="block">
                        <CategoryItem :category="category.name"
                            :img-uri="category.thumbnailCatUrl || 'https://picsum.photos/id/1005/32'" />
                    </NuxtLink>
                </div>
            </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

import type { ICategory, ISellerProfile } from '~/models';
import CategoryItem from '~/layouts/children/CategoryItem.vue';

const router = useRouter()
const props = defineProps<{
    categories: ICategory[];
    topSellers: ISellerProfile[];
}>();

const navigateToSeller = (slug: string) => {
    router.push(`/seller/profile/${slug}`);
};


</script>