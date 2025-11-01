<template>
    <HomeLayout>
        <!-- The default slot content (Main Feed) -->
        <div class="max-w-xl mx-auto py-6 space-y-8">
            <HomepageSkeleton v-if="pending && !mainFeed.length" />
            <div v-else-if="error" class="text-center py-20">
                <p class="text-red-500 dark:text-red-400">Failed to load feed. Please try again.</p>
            </div>
            <div v-else>
                <!-- Stories Carousel -->
                <section v-if="stories.length > 0 || userStore.isLoggedIn">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Today's Inspo</h2>
                    <div class="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">

                        <div v-if="userStore.isLoggedIn" class="flex flex-col items-center space-y-2 min-w-[80px]">
                            <div @click="showUploadModal = true"
                                class="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors border-2 border-dashed border-gray-300 dark:border-neutral-600">
                                <Icon name="mdi:plus-thick" class="w-8 h-8 text-gray-500 dark:text-neutral-400" />
                            </div>
                            <span class="text-xs text-gray-600 dark:text-neutral-400">Your Story</span>
                        </div>

                        <div v-else class="flex flex-col items-center space-y-2 min-w-[80px]">
                            <NuxtLink to="/auth/login"
                                class="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors border-2 border-dashed border-gray-300 dark:border-neutral-600">
                                <Icon name="mdi:login" class="w-8 h-8 text-gray-500 dark:text-neutral-400" />
                            </NuxtLink>
                            <span class="text-xs text-gray-600 dark:text-neutral-400">Log in to post</span>
                        </div>

                        <div v-for="story in stories" :key="story.id" @click="router.push(`/stories/${story.id}`)"
                            class="flex flex-col items-center space-y-2 min-w-[80px] cursor-pointer group">
                            <div class="relative"><img :src="getMediaThumbnailUrl(story.media)" alt="Story"
                                    class="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-neutral-700 group-hover:ring-[#f02c56]" />
                            </div>
                            <span class="text-xs text-center text-gray-600 dark:text-neutral-400 truncate w-20">{{
                                story.author.username || 'A user' }}</span>
                        </div>
                    </div>
                </section>

                <!-- Main Product Feed -->
                <section class="space-y-6">
                    <template v-for="item in mainFeed" :key="item.id">
                        <PostCard v-if="item.type === 'PRODUCT' && item.product" :product="item.product"
                            @open-comments="openCommentsModal" @open-details="openProductModal" />
                        <BuyerPostCard v-else-if="item.type === 'POST'" :item="item" @open-comments="openCommentsModal"
                            @open-details="openProductModal" />
                    </template>
                </section>

                <!-- Infinite Scroll Trigger -->
                <div ref="loadMoreTrigger" class="h-10"></div>
                <div v-if="productStore.isLoading" class="flex justify-center py-8">
                    <Icon name="eos-icons:loading" size="32" class="text-[#f02c56]" />
                </div>
            </div>
        </div>


        <!-- 
      THE FIX: The right sidebar is now a clean, two-part layout:
      1. A scrollable area for discovery (Shops & Categories).
      2. A sticky CTA for your AI feature.
    -->
        <template #right-sidebar>
            <div class="flex flex-col h-full">
                <!-- 1. Scrollable Content Area -->
                <div class="flex-1 overflow-y-auto scrollbar-hide space-y-6">

                    <!-- Top Shops Section -->
                    <div v-if="topSellers.length">
                        <h3 class="font-bold text-gray-800 dark:text-neutral-200 mb-2">Top Shops</h3>
                        <div class="space-y-2">
                            <NuxtLink v-for="seller in topSellers" :key="seller.store_slug"
                                :to="`/seller/profile/${seller.store_slug}`"
                                class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer">
                                <img :src="seller.store_logo || '/default-store-logo.png'" alt="Seller"
                                    class="w-8 h-8 rounded-full object-cover" />
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">{{
                                        seller.store_name }}</p>
                                    <p class="text-xs text-gray-500 dark:text-neutral-400">{{ seller._count?.products }}
                                        items</p>
                                </div>
                            </NuxtLink>
                        </div>
                    </div>

                    <hr class="border-gray-200 dark:border-neutral-800" />

                    <!-- Categories Section (Now a vertical list) -->
                    <div v-if="categories.length">
                        <h3 class="font-bold text-gray-800 dark:text-neutral-200 mb-2">Categories</h3>
                        <ul class="space-y-1">
                            <li v-for="cat in categories" :key="cat.id" @click="router.push(`/category/${cat.slug}`)"
                                class="text-sm text-gray-700 dark:text-neutral-300 cursor-pointer hover:text-[#f02c56]
                                dark:hover:text-[#df4949] hover:bg-gray-100 dark:hover:bg-neutral-800 px-2 py-1 rounded-md">
                                <img
                                    :src="cat.thumbnailCatUrl || 'https://picsum.photos/20/20'" alt="Category Icon"
                                    class="inline-block w-7 h-7 mr-2 object-cover rounded-full" />
                                {{ cat.name }}
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- 2. Sticky AI CTA at the bottom -->
                <div class="flex-shrink-0 pt-6">
                    <div
                        class="p-4 bg-gradient-to-br from-[#f02c56] to-purple-600 rounded-xl text-white text-center shadow-lg">
                        <Icon name="mdi:robot-happy-outline" class="w-12 h-12 mx-auto mb-2" />
                        <p class="font-semibold">AI Fashion Stylist</p>
                        <button @click="showAI = true"
                            class="mt-3 px-4 py-1.5 bg-white/90 text-[#f02c56] rounded-full text-xs font-bold hover:bg-white">Chat
                            Now</button>
                    </div>
                    <AIChat v-if="showAI" @close="showAI = false" />
                </div>
            </div>
        </template>

        <!-- Modals -->
        <ProductChatModal v-if="commentProduct" :is-open="isCommentModalOpen" :product="commentProduct"
            @close="isCommentModalOpen = false" />
        <ProductDetailModal :product="selectedProduct" @close="selectedProduct = null" />
        <StoryUploadModal :is-open="showUploadModal" @close="showUploadModal = false" @posted="refresh" />
    </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useProductStore, useCategoryStore, useStoryStore, useUserStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useLayoutData } from '~/composables/useLayoutData';
import { useRouter } from 'vue-router';
import { formatPrice, getMediaThumbnailUrl } from '~/utils/formatters';
import HomeLayout from '~/layouts/HomeLayout.vue';
import HomepageSkeleton from '~/components/skeletons/HomePageSkeleton.vue';
import PostCard from '~/components/home/PostCard.vue';
import BuyerPostCard from '~/components/home/BuyerPostCard.vue';
import AIChat from '~/components/chat/AIChat.vue';
import ProductChatModal from '~/components/chat/ProductChatModal.vue';
import ProductDetailModal from '~/components/home/ProductDetailModal.vue';
import StoryUploadModal from '~/components/stories/StoryModal.vue';
import type { IProduct, IReel } from '~/models';

const productStore = useProductStore();
const storyStore = useStoryStore();
const userStore = useUserStore();
const categoryStore = useCategoryStore();
const router = useRouter();
const apiService = useApiService();

const isCommentModalOpen = ref(false);
const commentProduct = ref<IProduct | null>(null);
const selectedProduct = ref<IProduct | null>(null);
const showAI = ref(false);
const showUploadModal = ref(false);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// 1. Fetch layout data (categories, top sellers) from our composable
const { data: layoutData } = useLayoutData();
const topSellers = computed(() => layoutData.value?.topSellers || []);

// 2. Fetch page-specific data (main feed, stories, accessories)
const { data: pageData, pending, error, refresh } = await useLazyAsyncData('homepage-main', async () => {
    const [feedData, storiesData, accessoriesData] = await Promise.all([
        apiService.getHomeFeed({ page: 1 }),
        apiService.getHomeStories(),
        apiService.getHotAccessories(),
        categoryStore.fetchCategories()
    ]);

    if (feedData.feed) productStore.setInitialFeed(feedData.feed);
    if (storiesData) storyStore.setHomepageStories(storiesData);

    return {
        stories: storiesData,
        hotAccessories: accessoriesData,
        categories: categoryStore.categories,
        hasMore: feedData.meta.hasMore
    };
});

// 3. Use computed properties to read from the stores
const stories = computed(() => storyStore.homepageStories);
const mainFeed = computed(() => productStore.mainFeed);
const hotAccessories = computed(() => pageData.value?.hotAccessories || []);
productStore.feedHasMore = pageData.value?.hasMore || false;
const categories = computed(() => categoryStore.categories || []);

const openCommentsModal = (product: IProduct) => {
    commentProduct.value = product;
    isCommentModalOpen.value = true;
};
const openProductModal = (item: IProduct) => {
    selectedProduct.value = item;
};
const loadMore = async () => {
    await productStore.fetchMoreFeedItems();
};

onMounted(() => {
    observer.value = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '200px' });
    if (loadMoreTrigger.value) observer.value.observe(loadMoreTrigger.value);
});

onUnmounted(() => {
    if (observer.value) observer.value.disconnect();
});
</script>
