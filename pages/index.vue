<template>
    <HomeLayout>
        <div class="max-w-xl mx-auto space-y-8">
        <HomepageSkeleton v-if="pending && !mainFeed.length" />
        <div v-else-if="error" class="text-center py-20">
            <p class="text-brand-dark dark:text-brand-light">Failed to load feed. Please try again.</p>
        </div>
        <div v-else>
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

                <section class="space-y-6">
                    <template v-for="item in mainFeed" :key="item.id">
                        <PostCard v-if="item.type === 'PRODUCT' && item.product" :product="item.product"
                             @open-comments="openCommentsModal" @open-details="openProductModal" />
                        <BuyerPostCard v-else-if="item.type === 'POST'" :item="item" @open-comments="openCommentsModal"
                            @open-details="openProductModal" />
                    </template>
                </section>

                <div ref="loadMoreTrigger" class="h-10"></div>
                <div v-if="feedStore.isLoading" class="flex justify-center py-8">
                     <Icon name="eos-icons:loading" size="32" class="text-brand" />
                </div>
            </div>
        </div>

        <template #right-sidebar>
             <RightSideNav :top-sellers="topSellers" :categories="categories" />
        </template>

        <<ProductCommentModal 
            :is-open="!!commentProduct" 
            :product="commentProduct"
            @close="commentProduct = null" 
        />
        
        <PostCommentModal 
            :is-open="!!commentPost" 
            :post="commentPost" 
            @close="commentPost = null" 
        />
        
        <ProductDetailModal :product="selectedProduct" @close="selectedProduct = null" />
        <StoryUploadModal :is-open="showUploadModal" @close="showUploadModal = false" @posted="refresh" />
    </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useProductStore, useCategoryStore, useStoryStore, useUserStore, useFeedStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useLayoutData } from '~/composables/useLayoutData';
import { useRouter } from 'vue-router';
import { getMediaThumbnailUrl } from '~/utils/formatters';
import HomeLayout from '~/layouts/HomeLayout.vue';
import HomepageSkeleton from '~/components/skeletons/HomePageSkeleton.vue';
import PostCard from '~/components/home/PostCard.vue';
import BuyerPostCard from '~/components/home/BuyerPostCard.vue';

import ProductDetailModal from '~/components/home/ProductDetailModal.vue';
import StoryUploadModal from '~/components/stories/StoryModal.vue';
import type { IFeedItem, IProduct } from '~/models';
import RightSideNav from '~/layouts/children/RightSideNav.vue';

import ProductCommentModal from '~/components/chat/ProductCommentModal.vue';
import PostCommentModal from '~/components/chat/PostCommentModal.vue';
import { notify } from '@kyvg/vue3-notification'; // Added missing notify import

const productStore = useProductStore();
const storyStore = useStoryStore();
const userStore = useUserStore();
const feedStore = useFeedStore();
const categoryStore = useCategoryStore();
const router = useRouter();
const apiService = useApiService();

// THE FIX: This variable is no longer needed and has been removed.
// const isCommentModalOpen = ref(false); 
const commentProduct = ref<IProduct | null>(null);
const commentPost = ref<IFeedItem | null>(null);
const selectedProduct = ref<IProduct | null>(null);
const showUploadModal = ref(false);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// 1. Fetch layout data
const { data: layoutData } = useLayoutData();
const topSellers = computed(() => layoutData.value?.topSellers || []);

// 2. Fetch page-specific data
const { data: pageData, pending, error, refresh } = await useLazyAsyncData('homepage-main', async () => {
    const [feedResponse, storiesData, accessoriesData] = await Promise.all([
        apiService.getHomeFeed({ limit: 10 }),
        apiService.getHomeStories(),
        apiService.getHotAccessories(),
        categoryStore.fetchCategories()
    ]);

    if (feedResponse) {
        feedStore.setInitialFeed(feedResponse.feed, feedResponse.meta);
    }
    if (storiesData) {
        storyStore.setHomepageStories(storiesData);
    }

    return {
        stories: storiesData,
        hotAccessories: accessoriesData,
        categories: categoryStore.categories,
    };
});
// 3. Use computed properties
const stories = computed(() => storyStore.homepageStories);
const mainFeed = computed(() => feedStore.mainFeed);
const hotAccessories = computed(() => pageData.value?.hotAccessories || []);
const categories = computed(() => categoryStore.categories || []);

// THE FIX: This function now simply sets the correct ref to open the modal.
const openCommentsModal = (item: IProduct | IFeedItem) => {
    if ('type' in item && item.type === 'POST') {
        commentPost.value = item; 
    } else {
        commentProduct.value = item as IProduct;
    }
};

const openProductModal = (item: IProduct) => {
    selectedProduct.value = item;
};
const loadMore = async () => {
    await feedStore.fetchMoreFeedItems();
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