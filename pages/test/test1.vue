<template>
    <div>
        <HomepageSkeleton v-if="pending" />
        <div v-else-if="error" class="text-center py-20">
            <p class="text-brand">Failed to load content. Please try again.</p>
        </div>

        <div v-else class="min-h-screen bg-gray-100">
            <!-- Header -->
            <header class="flex max-w-full bg-white shadow-sm h-14 px-4 justify-between items-center sticky top-0 z-20">
                <div class="flex space-x-4 items-center">
                    <NuxtLink to="/">
                        <div class="w-10 h-10 bg-brand rounded-full flex items-center justify-center">
                            <Icon name="mdi:store-fashion" class="w-6 h-6 text-white" />
                        </div>
                    </NuxtLink>
                    <div class="relative">
                        <input type="text" placeholder="Search..." class="bg-gray-100 text-sm rounded-full w-48 h-9 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#f02c56]" />
                        <Icon name="mdi:magnify" class="absolute right-3 top-2 text-gray-500" />
                    </div>
                </div>
                <div class="flex space-x-2">
                    <NuxtLink to="/cart" class="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <Icon name="mdi:cart-outline" class="w-6 h-6" />
                        <span v-if="cartStore.cartCount > 0" class="absolute -top-1 -right-1 bg-brand text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{{ cartStore.cartCount }}</span>
                    </NuxtLink>
                    <NuxtLink v-if="!userStore.isLoggedIn" to="/auth/login" class="px-4 py-2 bg-brand text-white rounded-md text-sm">Sign In</NuxtLink>
                    <NuxtLink v-else to="/buyer/profile" class="relative">
                        <img :src="userStore.userProfile?.avatar || '/default-avatar.png'" alt="Profile" class="w-10 h-10 rounded-full" />
                    </NuxtLink>
                </div>
            </header>

            <!-- Main 3-Column Layout -->
            <div class="flex flex-1 overflow-hidden">
                <!-- Left Sidebar -->
                <aside class="hidden md:block w-72 bg-white p-4 space-y-4 h-[calc(100vh-56px)] overflow-y-auto border-r">
                    <h3 class="font-bold text-gray-800">Top Shops</h3>
                    <NuxtLink v-for="seller in topSellers" :key="seller.store_slug" :to="`/seller/profile/${seller.store_slug}`" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <img :src="seller.store_logo || '/default-store-logo.png'" alt="Seller" class="w-8 h-8 rounded-full object-cover" />
                        <div>
                            <p class="text-sm font-medium text-gray-900">{{ seller.store_name }}</p>
                            <p class="text-xs text-gray-500">{{ seller._count?.products }} items</p>
                        </div>
                    </NuxtLink>
                    <hr class="my-4">
                    <h3 class="font-bold text-gray-800">Categories</h3>
                    <ul class="space-y-2">
                        <li v-for="cat in categories" :key="cat.id" @click="router.push(`/category/${cat.slug}`)" class="text-sm cursor-pointer hover:text-brand px-2 py-1 rounded">
                            {{ cat.name }}
                        </li>
                    </ul>
                </aside>

                <!-- Main Feed -->
                <main class="flex-1 overflow-y-auto px-4 py-6">
                    <!-- Stories (Using Dummy Data) -->
                    <section v-if="dummyStories.length" class="mb-8">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Today's Inspo</h2>
                        <div class="flex space-x-4 overflow-x-auto pb-4">
                            <div v-for="story in dummyStories" :key="story.id" @click="router.push(`/stories/${story.id}`)" class="flex flex-col items-center space-y-2 min-w-[80px] cursor-pointer group">
                                <div class="relative">
                                    <img :src="story.thumbnail" alt="Story" class="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-[#f02c56] transition-all" />
                                </div>
                                <span class="text-xs text-center text-gray-600 truncate w-20">{{ story.seller }}</span>
                            </div>
                        </div>
                    </section>
                    
                    <!-- Featured Looks -->
                    <section v-if="featuredProducts.length" class="mb-8">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Featured Looks</h2>
                        <Carousel :items-to-show="1.2" :wrap-around="true" :autoplay="4000">
                            <Slide v-for="product in featuredProducts" :key="product.id">
                                <NuxtLink :to="`/product/${product.slug}`" class="relative w-full h-56 rounded-xl overflow-hidden bg-gray-900 text-white block mx-2">
                                    <img :src="product.bannerImageUrl || product.media[0]?.url" class="w-full h-full object-cover opacity-70" />
                                    <div class="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-4">
                                        <h3 class="text-xl font-bold">{{ product.title }}</h3>
                                    </div>
                                </NuxtLink>
                            </Slide>
                        </Carousel>
                    </section>
                    
                    <!-- Fresh Drops -->
                    <section>
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Fresh Drops</h2>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <ProductCard v-for="product in products" :key="product.id" :product="product" />
                        </div>
                    </section>
                </main>

                <!-- Right Sidebar -->
                <aside class="hidden lg:block w-72 bg-white p-4 h-[calc(100vh-56px)] overflow-y-auto border-l space-y-6">
                    <!-- Hot Accessories Section -->
                    <div>
                        <h3 class="font-bold text-gray-800">Hot Accessories</h3>
                        <div class="mt-2 space-y-3">
                             <NuxtLink v-for="acc in hotAccessories" :key="acc.id" :to="`/product/${acc.slug}`" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                                <img :src="acc.media[0]?.url || '/default-product.png'" alt="Accessory" class="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate">{{ acc.title }}</p>
                                    <p class="text-xs text-gray-500">{{ formatPrice(acc.price) }}</p>
                                </div>
                            </NuxtLink>
                        </div>
                    </div>
                    
                    <hr class="my-4">

                    <!-- AI Chat Teaser -->
                    <div class="p-4 bg-gradient-to-br from-[#f02c56] to-purple-600 rounded-xl text-white text-center">
                        <Icon name="mdi:robot-happy-outline" class="w-12 h-12 mx-auto mb-2" />
                        <p class="font-semibold">AI Fashion Stylist</p>
                        <p class="text-sm mt-1">"What can I wear with this?"</p>
                        <button @click="showAI = true" class="mt-3 px-4 py-1.5 bg-white/90 text-brand rounded-full text-xs font-bold hover:bg-white">
                            Chat Now
                        </button>
                    </div>
                    <AIChat v-if="showAI" @close="showAI = false" />
                </aside>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProductStore, useCartStore, useUserStore, useCategoryStore} from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useRouter } from 'vue-router';
import { formatPrice } from '~/utils/formatters';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import HomepageSkeleton from '~/components/skeletons/HomePageSkeleton.vue';
import AIChat from '~/components/chat/AIChat.vue';
import 'vue3-carousel/dist/carousel.css';

const cartStore = useCartStore();
const userStore = useUserStore();
const categoryStore = useCategoryStore();
const router = useRouter();
const apiService = useApiService();

const showAI = ref(false);

const { data: pageData, pending, error } = await useAsyncData('homepage', async () => {
    const [homeData, _] = await Promise.all([
        apiService.getHomepageData(),
        categoryStore.fetchCategories()
    ]);
    return { ...homeData, categories: categoryStore.categories };
});

const featuredProducts = computed(() => pageData.value?.featuredProducts || []);
const products = computed(() => pageData.value?.products || []);
const topSellers = computed(() => pageData.value?.topSellers || []);
const categories = computed(() => pageData.value?.categories || []);
const hotAccessories = computed(() => pageData.value?.hotAccessories || []);

// Dummy Data for Stories (as this feature is not yet connected)
const dummyStories = ref([
  { id: 1, thumbnail: 'https://images.unsplash.com/photo-1606813902781-cbdb2cfdd6f0?w=200', seller: "Ada's Wardrobe" },
  { id: 2, thumbnail: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200', seller: 'ThreadHub' },
]);
</script>



<style scoped>
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>