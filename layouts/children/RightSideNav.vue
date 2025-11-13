<template>
    <div class="flex flex-col h-full">
        <!-- 1. Scrollable Content Area -->
        <div class="flex-1 overflow-y-auto space-y-6 custom-scrollbar">

            <!-- Top Shops Section -->
            <div v-if="topSellers.length">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-gray-800 dark:text-neutral-200">Top Shops</h3>
                    <!-- "See All" button -->
                    <NuxtLink to="/seller" class="text-sm font-semibold text-brand hover:underline mr-2">
                        See All
                    </NuxtLink>
                </div>
                <div class="space-y-1">
                    <div 
                        v-for="seller in topSellers" 
                        :key="seller.store_slug"
                        class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                        <NuxtLink :to="`/sellers/profile/${seller.store_slug}`" class="flex items-center space-x-3 min-w-0">
                            <img :src="seller.store_logo || '/default-store-logo.png'" alt="Seller"
                                class="w-8 h-8 rounded-full object-cover" />
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">
                                    {{ seller.store_name }}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-neutral-400">
                                    {{ seller._count?.products }} items
                                </p>
                            </div>
                        </NuxtLink>
                        
                        <!-- Follow button -->
                        <button 
                            v-if="userStore.isLoggedIn"
                            @click.stop.prevent="followStore.toggleFollow(seller.id)"
                            class="text-sm font-semibold hover:underline ml-2 shrink-0"
                            :class="isFollowing(seller.id) ? 'text-gray-500 dark:text-neutral-400' : 'text-brand'"
                        >
                            {{ isFollowing(seller.id) ? 'Following' : 'Follow' }}
                        </button>
                    </div>
                </div>
            </div>

            <hr class="border-gray-200 dark:border-neutral-800" />

            <!-- Categories Section -->
            <div v-if="categories.length">
                <h3 class="font-bold text-gray-800 dark:text-neutral-200 mb-2">Categories</h3>
                <ul class="space-y-1">
                    <li 
                        v-for="cat in categories" 
                        :key="cat.id" 
                        @click="router.push(`/category/${cat.slug}`)"
                        class="text-sm text-gray-700 dark:text-neutral-300 cursor-pointer hover:text-brand
                               dark:hover:text-brand hover:bg-gray-100 dark:hover:bg-neutral-800 px-2 py-1.5 rounded-md flex items-center"
                    >
                        <img 
                            :src="cat.thumbnailCatUrl || 'https://placehold.co/20x20/e2e8f0/9ca3af?text=C'" 
                            alt="Category Icon"
                            class="inline-block w-6 h-6 mr-2 object-cover rounded-md" 
                        />
                        <span>{{ cat.name }}</span>
                    </li>
                </ul>
            </div>
        </div>

        <!-- 2. Sticky AI CTA at the bottom -->
        <div class="flex-shrink-0 pt-6 sticky bottom-0 bg-white dark:bg-neutral-900">
            <div class="p-4 bg-gradient-to-br from-[#f02c56] to-purple-600 rounded-xl text-white text-center shadow-lg max-w-md mx-auto">
                <Icon name="mdi:robot-happy-outline" class="w-12 h-12 mx-auto mb-2" />
                <p class="font-semibold">AI Fashion Stylist</p>
                <button 
                    @click="showAI = true"
                    class="mt-3 px-4 py-1.5 bg-white/90 text-brand rounded-full text-xs font-bold hover:bg-white"
                >
                    Chat Now
                </button>
            </div>
            <AIChat v-if="showAI" @close="showAI = false" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore, useFollowStore } from '~/stores';
import type { ICategory, ISellerProfile } from '~/models';
import AIChat from '~/components/chat/AIChat.vue';

const props = defineProps<{
    categories: ICategory[];
    topSellers: ISellerProfile[];
}>();

const router = useRouter();
const userStore = useUserStore();
const followStore = useFollowStore();

const showAI = ref(false);

const isFollowing = (sellerId: string) => {
    return followStore.followedSellerIds.has(sellerId);
};
</script>

<style scoped>
/* Custom scrollbar styling */
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db; /* gray-300 for light mode */
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af; /* gray-400 */
}

/* Dark mode scrollbar */
:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #525252; /* neutral-600 for dark mode */
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #404040; /* neutral-700 */
}

/* Firefox scrollbar */
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
}

:global(.dark) .custom-scrollbar {
    scrollbar-color: #525252 transparent;
}
</style>