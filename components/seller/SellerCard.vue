<template>
    <div class="relative bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-neutral-800 transition-all duration-300 hover:shadow-lg">
        <!-- Banner Image -->
        <div class="h-24 bg-gray-200 dark:bg-neutral-800">
            <img 
                :src="seller.store_banner || 'https://placehold.co/400x100/e2e8f0/9ca3af?text=Banner'" 
                alt="Store Banner" 
                class="w-full h-full object-top-left object-cover"
            />
        </div>
        
        <!-- Avatar & Follow Button -->
        <div class="flex justify-between items-start p-4 -mt-12">
            <NuxtLink :to="`/sellers/profile/${seller.store_slug}`">
                <img 
                    :src="seller.store_logo || '/default-store-logo.png'" 
                    alt="Store Logo"
                    class="w-20 h-20 rounded-full border-4 border-white dark:border-neutral-900 shadow-lg object-cover"
                />
            </NuxtLink>
            <button 
                v-if="userStore.isLoggedIn"
                @click.stop.prevent="followStore.toggleFollow(seller.id)"
                class="text-sm font-semibold rounded-full px-4 py-1.5 transition-colors"
                :class="isFollowing(seller.id) 
                    ? 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-200 border border-gray-300 dark:border-neutral-700' 
                    : 'bg-[#f02c56] text-white'"
            >
                {{ isFollowing(seller.id) ? 'Following' : 'Follow' }}
            </button>
        </div>
        
        <!-- Seller Info -->
        <div class="px-4 pb-4">
            <NuxtLink :to="`/sellers/profile/${seller.store_slug}`">
                <h3 class="text-lg font-bold text-gray-900 dark:text-neutral-100 truncate">{{ seller.store_name }}</h3>
            </NuxtLink>
            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-neutral-400 mt-2">
                <span>
                    <strong class="text-gray-700 dark:text-neutral-200">{{ formatNumber(seller.followers_count || 0) }}</strong>
                    Followers
                </span>
                <span>
                    <strong class="text-gray-700 dark:text-neutral-200">{{ seller._count?.products || 0 }}</strong>
                    Products
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore, useFollowStore } from '~/stores';
import type { ISellerProfile } from '~/models';
import { formatNumber } from '~/utils/formatters';

const props = defineProps<{
    seller: ISellerProfile;
}>();

const userStore = useUserStore();
const followStore = useFollowStore();

const isFollowing = (sellerId: string) => {
    return followStore.followedSellerIds.has(sellerId);
};
</script>