<template>
  <!-- Similar Products Tab -->
  <div v-if="activeTab === 'similar'" class="p-8">
    <h2 class="text-xl font-semibold mb-4">Similar Products</h2>

    <div v-if="loading" class="text-center py-8">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="text-center py-8 text-red-500">
      {{ error }}
    </div>
    <div v-else-if="similarProducts.length === 0" class="text-center py-8 text-gray-500">
      No similar products found
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="similarProduct in similarProducts"
        :key="similarProduct.id"
        class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
      >
        <NuxtLink
          :to="`/product/${similarProduct.id}`"
          class="block group"
          :aria-label="`View ${similarProduct.title}`"
        >
          <!-- Media Display -->
          <div class="relative aspect-square overflow-hidden">
            <template v-if="similarProduct.media?.length">
              <video
                v-if="similarProduct.media[0]?.type === MediaType.VIDEO"
                :src="similarProduct.media[0].url"
                autoplay
                muted
                loop
                class="w-full h-full object-cover"
              />
              <img
                v-else-if="similarProduct.media[0]?.type === MediaType.IMAGE"
                :src="similarProduct.media[0].url"
                :alt="similarProduct.title"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </template>
            <img
              v-else
              src="/assets/images/cart-empty.png"
              :alt="`Placeholder for ${similarProduct.title}`"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <!-- Product Info -->
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {{ similarProduct.title }}
            </h3>
            <p class="text-gray-500 mt-1">
              {{ formatPrice(similarProduct.price) }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { MediaType } from '~/models/interface/products/media.interface';
import { useProductStore } from '~/stores/product.store';
import LoadingSpinner from '~/components/shared/Loading.vue';

interface Props {
  activeTab: 'details' | 'similar' | 'seller';
  productId: number | undefined;
}

const props = defineProps<Props>();
const productStore = useProductStore();
const error = ref<string | null>(null);
const loading = ref(false);
const similarProducts = ref<ProductInterface[]>([]);

// Price formatting utility
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol',
  }).format(price / 100);
};

const loadSimilarProducts = async () => {
  if (!props.productId) {
    error.value = 'No product ID provided';
    return;
  }

  loading.value = true;
  try {
    // Handle the Promise returned by getSimilarProducts
    const productsPromise = productStore.getSimilarProducts(props.productId);
    similarProducts.value = await productsPromise;
  } catch (err) {
    error.value = 'Failed to load similar products';
    console.error('Similar products error:', err);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.productId,
  (newId) => {
    if (newId) {
      loadSimilarProducts();
    } else {
      similarProducts.value = [];
      error.value = null;
    }
  },
  { immediate: true }
);
</script>