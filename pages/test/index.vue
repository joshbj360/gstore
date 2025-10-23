<template>
    <HomeLayout>

        <div>
            <HomePageSkeleton v-if="pending" />
            <div v-else-if="error" class="text-center py-20">
                <p class="text-brand">Failed to load content. Please try again.</p>
            </div>

            <div v-else>
                <section  class="mb-8">
                     <h2 class="text-lg font-semibold text-gray-900 mb-4">Today's Inspo</h2>
                <div class="flex space-x-4 overflow-x-auto pb-4">
                    <div v-for="story in stories" :key="story.id" @click="router.push(`/stories/${story.id}`)" class="flex flex-col items-center space-y-2 min-w-[80px] cursor-pointer group">
                        <div class="relative">

                            <img :src="getMediaThumbnailUrl(story.media)" alt="Story" class="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-[#f02c56] transition-all" />
                        </div>
                        <span class="text-xs text-center text-gray-600 truncate w-20">{{ story.seller.store_name }}</span>
                    </div>
                    <!-- Add Story Button for Sellers -->
                    <div v-if="userStore.isSeller" class="flex flex-col items-center space-y-2 min-w-[80px]">
                        <div @click="showUploadModal = true" class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                            <Icon name="mdi:plus-thick" class="w-8 h-8 text-gray-500" />
                        </div>
                        <span class="text-xs text-gray-600">Your Story</span>
                    </div>
                </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Featured Looks</h2>
                    <Carousel :items-to-show="1" :wrap-around="true" :autoplay="3000">
                        <Slide v-for="ad in dummyAds" :key="ad.id">
                            <div
                                class="relative w-full h-64 rounded-xl overflow-hidden bg-gradient-to-br from-brand to-purple-600">
                                <img :src="ad.image" alt="Ad" class="w-full h-full object-cover" />
                                <div
                                    class="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white">
                                    <h3 class="text-xl font-bold">{{ ad.title }}</h3>
                                    <p class="text-sm">{{ ad.subtitle }}</p>
                                    <button class="mt-4 px-6 py-2 bg-white text-brand rounded-full font-semibold">Shop
                                        Now</button>
                                </div>
                            </div>
                        </Slide>
                    </Carousel>
                </section>

                <!-- Product Feed -->
                <section>
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Fresh Drops</h2>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
                    </div>
                    <button v-if="!isLoadingMore" @click="loadMore"
                        class="w-full py-4 text-center text-brand font-semibold border-t border-gray-200">Load More
                        Trends</button>
                </section>
            </div>
        </div>

        <!-- <template #left-sidebar>
            <SideNav :top-sellers="topSellers" :categories="categories" />
        </template> -->

        <template #right-sidebar>
            <div class="space-y-6">
                <h3 v-if= "hotAccessories.length" class="font-bold text-gray-700">Hot Accessories</h3>
                <div v-for="acc in hotAccessories" :key="acc.id"
                    class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                    @click="openProduct(acc)">
                    <img  
                        :src="acc.media?.[0]?.url" 
                        alt="Accessory" 
                        class="w-16 h-16 rounded-md object-cover flex-shrink-0" 
                        :width="64"
                        :height="64"
                    />
        
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ acc.title }}</p>
                        <p class="text-xs text-gray-500">{{ formatPrice(acc.price) }}</p>
                    </div>
                </div>
                <hr class="my-4 border-gray-200">
                <div class="p-4 bg-gradient-to-r from-brand to-purple-600 rounded-xl text-white text-center">
                    <Icon name="mdi:robot" class="w-12 h-12 mx-auto mb-2" />
                    <p class="text-sm">Ask AI: "Pair this with jeans?"</p>
                    <button @click="showAI = true"
                        class="mt-2 px-4 py-1 bg-white text-brand rounded-full text-xs font-semibold">Chat
                        Now</button>
                </div>
                <AIChat v-if="showAI" @close="showAI = false" class="mt-4" />
            </div>
        </template>

    </HomeLayout>
     <!-- Story Upload Modal -->
  <StoryModal :is-open="showUploadModal" @close="showUploadModal = false" @posted="refresh" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { formatPrice } from '~/utils/formatters';
import { useApiService } from '~/services/api/apiService';
import { useCategoryStore } from '~/stores';
import { useRouter } from 'vue-router'; // For navigation

import AIChat from '~/components/chat/AIChat.vue';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import HomeLayout from '~/layouts/HomeLayout.vue';
import HomePageSkeleton from '~/components/skeletons/HomePageSkeleton.vue';
import SideNav from '~/layouts/children/SideNav.vue';
import StoryModal from '~/components/stories/StoryModal.vue';
import { getMediaThumbnailUrl } from '~/utils/formatters';

const router = useRouter();
const apiService = useApiService();
const categoryStore = useCategoryStore();
const userStore = useUserStore();
const productStore = useProductStore()

const { data: pageData, pending, error, refresh } = await useLazyAsyncData('homepage', async () => {
  const [homeData, _] = await Promise.all([
    apiService.getHomepageData(),
    categoryStore.fetchCategories()
  ]);
  return { ...homeData, categories: categoryStore.categories };
}, {
  default: () => ({ // SSR fallback: Shows skeleton until hydrate
    stories: [],
    featuredProducts: [],
    products: [],
    topSellers: [],
    hotAccessories: [],
  }),
  server: true, // Ensure SSR fetch (default, but explicit for prod)
});

const stories = computed(() => pageData.value?.stories || []);
const products = computed(() => pageData.value?.products || []);
const hotAccessories = computed(() => pageData.value?.hotAccessories || []);

// Create a mutable ref for featured products so we can push more items without mutating a readonly computed
const featuredProducts = ref<Array<any>>((pageData.value?.featuredProducts || []).slice());

// Keep the mutable featured list in sync when pageData updates
watch(pageData, (newVal) => {
  featuredProducts.value = (newVal?.featuredProducts || []).slice();
});


const dummyAds = ref([
    { id: 1, image: 'https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?w=800', title: 'Summer Vibes Collection', subtitle: '20% off dresses & tops' },
    { id: 2, image: 'https://images.unsplash.com/photo-1520975918318-3a6c29a6b3d3?w=800', title: 'Luxury Bags Drop', subtitle: 'Shop new arrivals' },
    { id: 3, image: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800', title: 'Men’s Streetwear', subtitle: 'Fresh looks from ThreadHub' },
]);


// State
const selectedProduct = ref<any | null>(null);
const showUploadModal = ref(false);
const showAI = ref(false);
const isLoadingMore = ref(false);

const openProduct = (product: any) => {
    selectedProduct.value = { ...product }; // Enhance dummy
};

const loadMore = async () => {
    isLoadingMore.value = true;
    try {
        await productStore.fetchMoreProducts();
        pageData.value.featuredProducts = [...pageData.value.featuredProducts, ...productStore.products];
    } catch (error) {
        console.error('Load more failed:', error);
    } finally {
        isLoadingMore.value = false;
    }
};

</script>

<style scoped>
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>