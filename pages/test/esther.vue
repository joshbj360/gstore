<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Nav (Fashion-ified FB Clone) -->
        <nav class="flex max-w-full bg-white drop-shadow-md h-14 px-4 justify-between items-center sticky top-0 z-10">
            <div class="flex space-x-4 items-center">
                <NuxtLink to="/">
                    <div class="w-10 h-10 bg-brand rounded-full flex items-center justify-center">
                        <Icon name="mdi:store-fashion" class="w-6 h-6 text-white" />
                    </div>
                </NuxtLink>
                <div class="relative">
                    <input v-model="searchQuery" type="text" placeholder="Search dresses, bags & more..."
                        class="bg-gray-200 text-sm rounded-full w-48 h-10 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-brand"
                        @input="debouncedSearch" />
                    <Icon v-if="searchQuery" name="mdi:close"
                        class="absolute right-3 top-2.5 text-gray-500 cursor-pointer" @click="searchQuery = ''" />
                </div>
            </div>
            <div class="hidden md:flex space-x-4">
                <button class="p-2 rounded-md hover:bg-gray-100" @click="activeTab = 'feed'">
                    <Icon :name="activeTab === 'feed' ? 'mdi:home' : 'mdi:home-outline'" class="w-6 h-6 text-brand" />
                </button>
                <button class="p-2 rounded-md hover:bg-gray-100" @click="activeTab = 'reels'">
                    <Icon :name="activeTab === 'reels' ? 'mdi:store-outline' : 'mdi:store-outline'"
                        class="w-6 h-6" />
                </button>
                <button class="p-2 rounded-md hover:bg-gray-100" @click="activeTab = 'reels'">
                    <Icon :name="activeTab === 'reels' ? 'mdi:play-circle' : 'mdi:play-circle-outline'"
                        class="w-6 h-6" />
                </button>
                
                <NuxtLink to="/seller/dashboard" class="p-2 rounded-md hover:bg-gray-100">
                    <Icon name="mdi:account-edit" class="w-6 h-6" />
                </NuxtLink>
            </div>
            <div class="flex space-x-2">
                <button class="relative p-2 bg-gray-200 rounded-full hover:bg-gray-300" @click="toggleCart">
                    <Icon name="mdi:cart" class="w-6 h-6" />
                    <span v-if="cartCount > 0"
                        class="absolute -top-1 -right-1 bg-brand text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{{
                        cartCount }}</span>
                </button>
                <button v-if="!isLoggedIn" class="px-4 py-2 bg-brand text-white rounded-md text-sm">Sign In</button>
                <div v-else class="relative">
                    <img src="https://picsum.photos/80/80" alt="Profile" class="w-10 h-10 rounded-full cursor-pointer"
                        @click="toggleProfile" />
                </div>
            </div>
        </nav>

        <!-- Main Layout -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Left Sidebar: Quick Shops & Categories -->
            <aside class="hidden md:block w-64 bg-white border-r p-4 space-y-4 h-[calc(100vh-56px)] overflow-y-auto">
                <h3 class="font-bold text-gray-700 mb-2">Featured Shops</h3>
                <div v-for="seller in topSellers" :key="seller.id"
                    class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    @click="navigateToSeller(seller.store_slug)">
                    <img :src="seller.store_logo || 'https://picsum.photos/80/80'" alt="Seller" class="w-8 h-8 rounded-full object-cover" />
                    <div>
                        <p class="text-sm font-medium text-gray-900">{{ seller.store_name }}</p>
                        <p class="text-xs text-gray-500">{{ seller._count?.products }} items</p>
                    </div>
                </div>
                <hr class="my-4 border-gray-200">
                <h3 class="font-bold text-gray-700 mb-2">Categories</h3>
                <ul class="space-y-2">
                    <li v-for="cat in categories" :key="cat.id"
                        class="text-sm cursor-pointer hover:text-brand transition-colors px-2 py-1 rounded"
                        @click="setCategory(cat.slug)">
                        {{ cat.name }}
                    </li>
                </ul>
            </aside>

            <!-- Main Feed -->
            <main class="flex-1 overflow-y-auto px-4 py-6 bg-gray-50">
                <!-- Stories Row -->
                <section class="mb-8">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Today's Outfit Inspo</h2>
                    <div class="flex space-x-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                        <div v-for="story in dummyStories" :key="story.id"
                            class="flex flex-col items-center space-y-2 min-w-[80px] snap-center cursor-pointer group"
                            @click="openStory(story)">
                            <div class="relative">
                                <img :src="story.thumbnail" alt="Story"
                                    class="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-brand transition-all" />
                                <div
                                    class="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Icon name="mdi:play" class="w-8 h-8 text-white" />
                                </div>
                                <div v-if="story.isNew"
                                    class="absolute -top-1 -right-1 bg-brand text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                    New</div>
                            </div>
                            <span class="text-xs text-center text-gray-600 truncate w-20">{{ story.seller }}</span>
                        </div>
                        <!-- Add Story for Sellers -->
                        <div v-if="isSeller" class="flex flex-col items-center space-y-2 min-w-[80px] snap-center">
                            <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
                                @click="openUpload">
                                <Icon name="mdi:plus-thick" class="w-8 h-8 text-gray-500" />
                            </div>
                            <span class="text-xs text-gray-600">Your Story</span>
                        </div>
                    </div>
                </section>

                <!-- Reels/Ads Carousel -->
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
                    <div v-if="isLoading" class="space-y-4">
                        <ProductGridSkeleton v-for="i in 3" :key="i" />
                    </div>
                    <div v-else-if="!featuredProducts.length" class="text-center py-12 text-gray-500">
                        <Icon name="mdi:tag-heart" size="48" class="mx-auto mb-4 text-gray-300" />
                        <p class="text-lg">No trends loading... Try searching!</p>
                    </div>
                    <div v-else class="space-y-6">
                        <div v-for="product in featuredProducts" :key="product.id"
                            class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                            @mouseenter="hoveredProduct = product.id" @click="openProduct(product)">
                            <!-- Simple Product Card Fallback (Reuse your ProductCard if available) -->
                            <div class="relative overflow-hidden">
                                <img :src="product.media[0]?.url || '/dummy-product.jpg'" alt="Product"
                                    class="w-full h-64 object-cover group-hover:scale-105 transition-transform" />
                                <div class="absolute top-2 right-2 bg-brand text-white px-2 py-1 rounded-full text-xs">
                                    New</div>
                            </div>
                            <div class="p-4">
                                <h3 class="font-semibold text-gray-900 line-clamp-1">{{ product.title }}</h3>
                                <p class="text-sm text-gray-600 mt-1">{{ product.category  }}</p>
                                <div class="flex items-center justify-between mt-2">
                                    <span class="text-lg font-bold text-brand">{{ formatPrice(product.price) }}</span>
                                    <div class="flex space-x-2">
                                        <button @click.stop="addToCart(product)"
                                            class="px-3 py-1 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark">Bag</button>
                                        <button v-if="hoveredProduct === product.id" @click.stop
                                            class="p-1 text-gray-500 hover:text-brand" title="Chat with AI">
                                            <Icon name="mdi:robot" class="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Mock Infinite Scroll -->
                    <button v-if="!isLoadingMore" @click="loadMore"
                        class="w-full py-4 text-center text-brand font-semibold border-t border-gray-200">Load More
                        Trends</button>
                </section>
            </main>

            <!-- Right Sidebar: Trending + AI Teaser -->
            <aside class="hidden lg:block w-80 bg-white border-l p-4 space-y-6 h-[calc(100vh-56px)] overflow-y-auto">
                <h3 class="font-bold text-gray-700">Hot Accessories</h3>
                <div v-for="acc in dummyAccessories" :key="acc.id"
                    class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                    @click="openProduct(acc)">
                    <img :src="acc.image" alt="Accessory" class="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ acc.name }}</p>
                        <p class="text-xs text-gray-500">{{ formatPrice(acc.price) }}</p>
                    </div>
                </div>
                <hr class="my-4 border-gray-200">
                <div class="p-4 bg-gradient-to-r from-brand to-purple-600 rounded-xl text-white text-center">
                    <Icon name="mdi:robot" class="w-12 h-12 mx-auto mb-2" />
                    <p class="text-sm">Ask AI: "Pair this with jeans?"</p>
                    <button @click="showAI = true"
                        class="mt-2 px-4 py-1 bg-white text-brand rounded-full text-xs font-semibold">Chat Now</button>
                </div>
                <AIChat v-if="showAI" @close="showAI = false" class="mt-4" />
            </aside>
        </div>

        <!-- Modals -->
        <ProductDetailSidePanel v-if="selectedProduct" :product="selectedProduct" :seller-store="dummySeller"
            @close="selectedProduct = null" />
        <div v-if="showUploadModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 class="text-lg font-bold mb-4">Upload Your Story</h3>
                <UploadWidget @upload-complete="handleUpload" />
                <button @click="showUploadModal = false"
                    class="mt-4 w-full py-2 bg-brand text-white rounded">Post</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { formatPrice } from '~/utils/formatters';
import { useApiService } from '~/services/api/apiService';
import { useCategoryStore } from '~/stores';
import { useRouter } from 'vue-router'; // For navigation

import ProductDetailSidePanel from '~/components/product/ProductDetailSidePanel.vue';
import UploadWidget from '~/components/upload/UploadWidget.vue';
import AIChat from '~/components/chat/AIChat.vue';

const router = useRouter();
const apiService = useApiService();
const categoryStore = useCategoryStore();

 //`useAsyncData` fetches all necessary data for the homepage in a single batch
const { data: pageData, pending, error } = await useAsyncData('homepage', async () => {
    const [homeData, _] = await Promise.all([
        apiService.getHomepageData(),
        categoryStore.fetchCategories() // Fetches and caches categories
    ]);
    return { ...homeData, categories: categoryStore.categories };
});

const featuredProducts = computed(() => pageData.value?.featuredProducts || []);
const products = computed(() => pageData.value?.products || []);
const topSellers = computed(() => pageData.value?.topSellers || []);
const categories = computed(() => pageData.value?.categories || []);
// Dummy Data (Hardcoded for Preview)
const dummyStories = ref([
  { id: 1, thumbnail: 'https://images.unsplash.com/photo-1606813902781-cbdb2cfdd6f0?w=200', seller: "Ada's Wardrobe", isNew: true },
  { id: 2, thumbnail: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200', seller: 'ThreadHub', isNew: true },
  { id: 3, thumbnail: 'https://images.unsplash.com/photo-1544441892-31b4b54b4a39?w=200', seller: 'Urban Threads', isNew: false },
  { id: 4, thumbnail: 'https://images.unsplash.com/photo-1600185365483-26d7a5a5cf65?w=200', seller: 'VogueVault', isNew: false },
  { id: 5, thumbnail: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200', seller: 'Style Avenue', isNew: false },
]);

const dummyAds = ref([
  { id: 1, image: 'https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?w=800', title: 'Summer Vibes Collection', subtitle: '20% off dresses & tops' },
  { id: 2, image: 'https://images.unsplash.com/photo-1520975918318-3a6c29a6b3d3?w=800', title: 'Luxury Bags Drop', subtitle: 'Shop new arrivals' },
  { id: 3, image: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800', title: 'Men’s Streetwear', subtitle: 'Fresh looks from ThreadHub' },
]);




const dummyAccessories = ref([
  { id: 1, name: 'Gold Hoop Earrings', price: 5000, image: 'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=200' },
  { id: 2, name: 'Leather Crossbody Bag', price: 15000, image: 'https://images.unsplash.com/photo-1618354691373-d851c4f2b13e?w=200' },
  { id: 3, name: 'Statement Necklace', price: 8000, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200' },
  { id: 4, name: 'Sunglasses', price: 12000, image: 'https://images.unsplash.com/photo-1520975918318-3a6c29a6b3d3?w=200' },
]);


const dummySeller = ref({
  store_name: "Ada's Wardrobe",
  avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
});

// State
const searchQuery = ref('');
const activeTab = ref<'feed' | 'reels'>('feed');
const selectedProduct = ref<any | null>(null);
const hoveredProduct = ref<number | null>(null);
const showUploadModal = ref(false);
const showAI = ref(false);
const isLoggedIn = ref(true); // Mock
const isSeller = ref(true); // Mock
const cartCount = ref(3); // Mock
const isLoading = ref(false);
const isLoadingMore = ref(false);

// Actions
const debouncedSearch = useDebounceFn(() => {
    if (searchQuery.value) router.push(`/search?q=${searchQuery.value}`);
}, 300);

const openProduct = (product: any) => {
    selectedProduct.value = { ...product }; // Enhance dummy
};

const openStory = (story: any) => {
    // Mock: Open first product as story
    openProduct(featuredProducts.value[0]);
};

const addToCart = (product: any) => {
    cartCount.value++;
    console.log('Added to cart:', product.title); // Mock cart action
};

const setCategory = (slug: string) => {
    console.log('Filter by:', slug); // Mock filter
};

const navigateToSeller = (slug: string) => {
    router.push(`/seller/profile/${slug}`);
};

const openUpload = () => {
    showUploadModal.value = true;
};

const handleUpload = (media: any[]) => {
    console.log('Uploaded:', media); // Mock CMS upload
    showUploadModal.value = false;
};

const loadMore = () => {
    isLoadingMore.value = true;
    setTimeout(() => {
        // Mock: Add 3 more dummies
        featuredProducts.value.push(...[
            { id: 7, title: 'Abaya 004', price: 18000, category: 'Women clothing', media: [{ url: 'https://picsum.photos/300/400?random=26' }], slug: 'abaya-004', description: 'Beautiful abaya design', discount: 0, status: 'active', stock: 10, seller_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
            { id: 8, title: 'Abaya 005', price: 18000, category: 'Women clothing', media: [{ url: 'https://picsum.photos/300/400?random=27' }], slug: 'abaya-005', description: 'Stylish abaya design', discount: 0, status: 'active', stock: 10, seller_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
            { id: 9, title: 'Abaya 006', price: 18000, category: 'Women clothing', media: [{ url: 'https://picsum.photos/300/400?random=28' }], slug: 'abaya-006', description: 'Modern abaya design', discount: 0, status: 'active', stock: 10, seller_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
        ]);
        isLoadingMore.value = false;
    }, 1000);
};

const toggleCart = () => router.push('/buyer/cart');
const toggleProfile = () => router.push('/buyer/profile');

// Mount: Simulate loading
onMounted(() => {
    isLoading.value = true;
    setTimeout(() => { isLoading.value = false; }, 1500);
});
</script>

<style scoped>
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>