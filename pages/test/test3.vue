<template>
  <HomeLayout>
    <!-- Main Feed -->
    <div>
      <HomePageSkeleton v-if="pending" />
      <div v-else-if="error" class="text-center py-20">
        <p class="text-brand">Failed to load content. Please try again.</p>
      </div>

      <div v-else>
        <!-- Story Highlights -->
        <section class="mb-8">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Today's Inspo
          </h2>
          <div class="flex space-x-4 overflow-x-auto pb-4">
            <div
              v-for="story in stories"
              :key="story.id"
              @click="router.push(`/stories/${story.id}`)"
              class="flex flex-col items-center space-y-2 min-w-[80px] cursor-pointer group"
            >
              <div class="relative">
                <img
                  :src="getMediaThumbnailUrl(story.media)"
                  alt="Story"
                  class="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-[#f02c56] transition-all"
                />
              </div>
              <span class="text-xs text-center text-gray-600 dark:text-gray-400 truncate w-20">
                {{ story.seller.store_name }}
              </span>
            </div>

            <!-- Add Story Button -->
            <div v-if="userStore.isSeller" class="flex flex-col items-center space-y-2 min-w-[80px]">
              <div
                @click="showUploadModal = true"
                class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <Icon name="mdi:plus-thick" class="w-8 h-8 text-gray-500 dark:text-gray-300" />
              </div>
              <span class="text-xs text-gray-600 dark:text-gray-400">Your Story</span>
            </div>
          </div>
        </section>

        <!-- Product Feed (Social Commerce Style) -->
        <section class="space-y-8">
          <div
            v-for="product in featuredProducts"
            :key="product.id"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
          >
            <!-- Seller Header -->
            <div class="flex items-center p-3">
              <img
                :src="product.seller?.avatar || '/default-avatar.png'"
                class="w-10 h-10 rounded-full object-cover"
              />
              <div class="ml-3">
                <p class="font-semibold text-gray-900 dark:text-gray-100">
                  {{ product.seller?.store_name || 'Unknown Seller' }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ product.seller?.followers || 0 }} followers
                </p>
              </div>
              <button
                class="ml-auto text-brand text-sm font-semibold hover:underline"
                @click.stop="toggleFollow(product.seller)"
              >
                {{ product.seller?.isFollowed ? 'Following' : 'Follow' }}
              </button>
            </div>

            <!-- Product Media -->
            <div class="relative">
              <MediaDisplay :media-list="product.media" class="w-full h-[420px]" />

              <!-- Quick Actions -->
              <div class="absolute bottom-4 left-4 flex space-x-3">
                <button @click.stop="toggleLike(product)">
                  <Icon
                    :name="product.isLiked ? 'mdi:heart' : 'mdi:heart-outline'"
                    class="text-white w-6 h-6"
                  />
                </button>
                <button @click.stop="shareProduct(product)">
                  <Icon name="mdi:share-variant" class="text-white w-6 h-6" />
                </button>
              </div>
            </div>

            <!-- Product Info -->
            <div class="p-4 flex justify-between items-center">
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-100">
                  {{ product.title }}
                </p>
                <p class="text-sm text-gray-500">{{ formatPrice(product.price) }}</p>
              </div>
              <button
                @click="addToCart(product)"
                class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-dark"
              >
                Bag it!
              </button>
            </div>

            <!-- AI Suggestion -->
            <div class="p-3 border-t border-gray-100 dark:border-gray-700 text-sm">
              <p class="text-gray-600 dark:text-gray-400 italic">
                💡 Try this with a
                <span class="text-brand cursor-pointer" @click="showAI = true">white denim jacket?</span>
              </p>
            </div>
          </div>

          <!-- Load More -->
          <button
            v-if="!isLoadingMore"
            @click="loadMore"
            class="w-full py-4 text-center text-brand font-semibold border-t border-gray-200 dark:border-gray-700"
          >
            Load More Trends
          </button>
          <div v-else class="text-center py-6 text-gray-500">Loading more...</div>
        </section>
      </div>
    </div>

    <!-- Left Sidebar -->
    <template #left-sidebar>
      <SideNav :top-sellers="topSellers" :categories="categories" />
    </template>

    <!-- Right Sidebar -->
    <template #right-sidebar>
      <div class="space-y-6">
        <h3 v-if="hotAccessories.length" class="font-bold text-gray-700 dark:text-gray-100">
          Hot Accessories
        </h3>
        <div
          v-for="acc in hotAccessories"
          :key="acc.id"
          class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          @click="openProduct(acc)"
        >
          <img
            :src="acc.media?.[0]?.url"
            alt="Accessory"
            class="w-16 h-16 rounded-md object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {{ acc.title }}
            </p>
            <p class="text-xs text-gray-500">{{ formatPrice(acc.price) }}</p>
          </div>
        </div>

        <hr class="my-4 border-gray-200 dark:border-gray-700" />

        <!-- AI Chat Card -->
        <div
          class="p-4 bg-gradient-to-r from-brand to-purple-600 rounded-xl text-white text-center"
        >
          <Icon name="mdi:robot" class="w-12 h-12 mx-auto mb-2" />
          <p class="text-sm">Ask AI: "Pair this with jeans?"</p>
          <button
            @click="showAI = true"
            class="mt-2 px-4 py-1 bg-white text-brand rounded-full text-xs font-semibold"
          >
            Chat Now
          </button>
        </div>

        <AIChat v-if="showAI" @close="showAI = false" class="mt-4" />
      </div>
    </template>

    <!-- Story Upload Modal -->
    <StoryModal :is-open="showUploadModal" @close="showUploadModal = false" @posted="refresh" />

    <!-- Floating AI Button -->
    <button
      class="fixed bottom-6 right-6 bg-brand text-white rounded-full p-3 shadow-lg hover:bg-brand-dark"
      @click="showAI = true"
    >
      <Icon name="mdi:robot" class="w-6 h-6" />
    </button>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatPrice, getMediaThumbnailUrl } from '~/utils/formatters'
import { useApiService } from '~/services/api/apiService'
import { useCategoryStore, useUserStore, useProductStore } from '~/stores'

import HomeLayout from '~/layouts/HomeLayout.vue'
import SideNav from '~/layouts/children/SideNav.vue'
import HomePageSkeleton from '~/components/skeletons/HomePageSkeleton.vue'
import StoryModal from '~/components/stories/StoryModal.vue'
import AIChat from '~/components/chat/AIChat.vue'
import MediaDisplay from '~/components/product/productDetails/mediaSection/MediaDisplay.vue'

const router = useRouter()
const apiService = useApiService()
const categoryStore = useCategoryStore()
const userStore = useUserStore()
const productStore = useProductStore()
const cartStore = useCartStore()

const { data: pageData, pending, error, refresh } = await useLazyAsyncData(
  'homepage',
  async () => {
    const [homeData, _] = await Promise.all([
      apiService.getHomepageData(),
      categoryStore.fetchCategories(),
    ])
    return { ...homeData, categories: categoryStore.categories }
  },
  {
    default: () => ({
      stories: [],
      featuredProducts: [],
      products: [],
      topSellers: [],
      categories: [],
      hotAccessories: [],
    }),
  }
)

const stories = computed(() => pageData.value?.stories || [])
const featuredProducts = ref((pageData.value?.featuredProducts || []).slice())
const topSellers = computed(() => pageData.value?.topSellers || [])
const categories = computed(() => pageData.value?.categories || [])
const hotAccessories = computed(() => pageData.value?.hotAccessories || [])

watch(pageData, (newVal) => {
  featuredProducts.value = (newVal?.featuredProducts || []).slice()
})

const showUploadModal = ref(false)
const showAI = ref(false)
const isLoadingMore = ref(false)

const loadMore = async () => {
  isLoadingMore.value = true
  try {
    await productStore.fetchMoreProducts()
    pageData.value.featuredProducts = [
      ...pageData.value.featuredProducts,
      ...productStore.products,
    ]
  } catch (error) {
    console.error('Load more failed:', error)
  } finally {
    isLoadingMore.value = false
  }
}

const toggleLike = (product: any) => {
  product.isLiked = !product.isLiked
}

const toggleFollow = (seller: any) => {
  seller.isFollowed = !seller.isFollowed
}

const shareProduct = (product: any) => {
  if (navigator.share) {
    navigator.share({
      title: product.title,
      text: 'Check this out!',
      url: window.location.origin + '/product/' + product.id,
    })
  } else {
    alert('Sharing not supported on this device')
  }
}

const addToCart = (product: any) => {
  cartStore.addToCart(product, product.variants?.[0] || null, 1)
}
</script>
