<template>
  <HomeLayout>
    <!-- The default slot content (Main Feed) -->
    <div class="max-w-xl mx-auto py-6 space-y-8">
        <HomepageSkeleton v-if="pending && !products.length" />
        <div v-else-if="error" class="text-center py-20">
            <p class="text-brand">Failed to load content. Please try again.</p>
        </div>
        <div v-else>
            <!-- In your pages/index.vue file -->
<section class="mb-8">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Today's Inspo</h2>
    
    <!-- THE FIX: Add the "scrollbar-hide" class to this div -->
    <div class="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        
        <div v-for="story in stories" :key="story.id" @click="router.push(`/stories/${story.id}`)" class="flex flex-col items-center space-y-2 min-w-[80px] cursor-pointer group">
            <div class="relative"><img :src="getMediaThumbnailUrl(story.media)" alt="Story" class="w-20 h-20 rounded-full object-cover ring-2 ring-neutral-700 group-hover:ring-[#f02c56]" /></div>
            <span class="text-xs text-center text-neutral-400 truncate w-20">{{ story.seller.store_name }}</span>
        </div>
    </div>
</section>
            <!-- Main Product Feed -->
            <section class="space-y-6">
                <!-- THE FIX: The card now emits @open-details and @open-comments -->
                <PostCard 
                    v-for="product in products" 
                    :key="product.id" 
                    :product="product" 
                    @open-comments="openCommentsModal"
                    @open-details="openProductModal"
                />
            </section>

            <!-- Infinite Scroll Trigger -->
            <div ref="loadMoreTrigger" class="h-10"></div>
            <div v-if="productStore.isLoading" class="flex justify-center py-8">
                <Icon name="eos-icons:loading" size="32" class="text-[#f02c56]" />
            </div>
        </div>
    </div>
    
    <!-- Content for the "left-sidebar" slot -->
    <!-- <template #left-sidebar>
        <SideNav :top-sellers="topSellers" :categories="categories" />
    </template> -->

    <!-- Content for the "right-sidebar" slot -->
    <template #right-sidebar>
        <div class="space-y-6">
            <div v-if="hotAccessories.length">
                <h3 class="font-bold text-gray-100">Hot Accessories</h3>
                <div class="mt-2 space-y-3">
                     <NuxtLink v-for="acc in hotAccessories" :key="acc.id" :to="`/product/${acc.slug}`" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-800 cursor-pointer">
                        <img :src="acc.media[0]?.url || '/default-product.png'" alt="Accessory" class="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-neutral-100 truncate">{{ acc.title }}</p>
                            <p class="text-xs text-neutral-400">{{ formatPrice(acc.price) }}</p>
                        </div>
                    </NuxtLink>
                </div>
            </div>
            <hr class="border-neutral-800" />
            <div class="p-4 bg-gradient-to-br from-[#f02c56] to-purple-600 rounded-xl text-white text-center">
                <Icon name="mdi:robot-happy-outline" class="w-12 h-12 mx-auto mb-2" />
                <p class="font-semibold">AI Fashion Stylist</p>
                <button @click="showAI = true" class="mt-3 px-4 py-1.5 bg-white/90 text-[#f02c56] rounded-full text-xs font-bold hover:bg-white">Chat Now</button>
            </div>
            <AIChat v-if="showAI" @close="showAI = false" />
        </div>
    </template>
    
    <!-- Modals -->
    <ProductChatModal v-if="commentProduct" :is-open="isCommentModalOpen" :product="commentProduct" @close="isCommentModalOpen = false" />
    <!-- THE FIX: We now render the new ProductDetailModal -->
    <ProductDetailModal :product="selectedProduct" @close="selectedProduct = null" />
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useProductStore, useCategoryStore, useStoryStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useRouter } from 'vue-router';
import { formatPrice } from '~/utils/formatters';
import { getMediaThumbnailUrl } from '~/utils/formatters';
import HomeLayout from '~/layouts/HomeLayout.vue';
import HomepageSkeleton from '~/components/skeletons/HomePageSkeleton.vue';
import PostCard from '~/components/home/PostCard.vue';
import AIChat from '~/components/chat/AIChat.vue';
import ProductChatModal from '~/components/chat/ProductChatModal.vue';
import ProductDetailModal from '~/components/home/ProductDetailModal.vue'; // Import the new modal
import SideNav from '~/layouts/children/SideNav.vue';
import type { IProduct } from '~/models';

const productStore = useProductStore();
const storyStore = useStoryStore();
const categoryStore = useCategoryStore();
const router = useRouter();
const apiService = useApiService();

const isCommentModalOpen = ref(false);
const commentProduct = ref<IProduct | null>(null);
const selectedProduct = ref<IProduct | null>(null); // State for the details modal
const showAI = ref(false);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

const { data: pageData, pending, error } = await useLazyAsyncData('homepage', async () => {
    const [homeData, _] = await Promise.all([
        apiService.getHomepageData(),
        categoryStore.fetchCategories()
    ]);
    if(homeData.products) productStore.setInitialProducts(homeData.products);
    if(homeData.stories) storyStore.setHomepageStories(homeData.stories);
    return homeData;
});

const stories = computed(() => storyStore.homepageStories);
const products = computed(() => productStore.products);

const hotAccessories = computed(() => pageData.value?.hotAccessories || []);

const openCommentsModal = (product: IProduct) => {
    commentProduct.value = product;
    isCommentModalOpen.value = true;
};

// This function is called by the PostCard's emit
const openProductModal = (product: IProduct) => {
    selectedProduct.value = product;
};

const loadMore = async () => {
    if (productStore.isLoading || !productStore.hasMoreProducts) return;
    await productStore.fetchMoreProducts();
};

onMounted(() => {
    observer.value = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '200px' });
    if(loadMoreTrigger.value) observer.value.observe(loadMoreTrigger.value);
});

onUnmounted(() => {
    if(observer.value) observer.value.disconnect();
});
</script>

<style scoped>  
/* This utility class hides the scrollbar across all browsers */
.scrollbar-hide {
    /* For Firefox */
    scrollbar-width: none;
    /* For Internet Explorer and Edge */
    -ms-overflow-style: none;
}

.scrollbar-hide::-webkit-scrollbar {
    /* For Chrome, Safari, and Opera */
    display: none;
}
</style>
