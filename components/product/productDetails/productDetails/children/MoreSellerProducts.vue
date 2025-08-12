<template>
  <!-- Seller Products Tab -->
  <div v-if="activeTab === 'seller'" class="p-8">
    <h2 class="text-xl font-semibold mb-4">More Products from {{ store_name }}</h2>

    <div v-if="loading" class="text-center py-8">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="text-center py-8 text-red-500">
      {{ error }}
    </div>
    <div v-else-if="moreSellerProducts.length === 0" class="text-center py-8 text-gray-500">

      No products from this {{ store_name }} yet.
      <br />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="product in moreSellerProducts"
        :key="product.id"
        class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
      >
        <NuxtLink
          :to="`/product/${product.id}`"
          class="block group"
          :aria-label="`View ${product.title}`"
        >
          <!-- Media Display -->
          <div class="relative aspect-square overflow-hidden">
            <template v-if="product.media?.length">
              <video
                v-if="product.media[0]?.type === MediaType.VIDEO"
                :src="product.media[0].url"
                autoplay
                muted
                loop
                class="w-full h-full object-cover"
              />
              <img
                v-else-if="product.media[0]?.type === MediaType.IMAGE"
                :src="product.media[0].url"
                :alt="product.title"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </template>
            <img
              v-else
              src="/assets/images/cart-empty.png"
              :alt="`Placeholder for ${product.title}`"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <!-- Product Info -->
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {{ product.title }}
            </h3>
            <p class="text-gray-500 mt-1">
              {{ formatPrice(product.price) }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductInterface } from '../../../../../models/interface/products/product.interface';
import { MediaType } from '../../../../../models/interface/products/media.interface';
import type { SellerStoreInterface } from '../../../../../models/interface/auth/user.interface';
import { useProductStore } from '../../../../../stores/product.store';
import LoadingSpinner from '../../../../shared/Loading.vue';
import { onMounted, ref, watch } from 'vue';

interface Props {
  activeTab: 'details' | 'similar' | 'seller';
  productId: number | undefined;
  store_name: string | undefined
}

const props = defineProps<Props>();
const productStore = useProductStore();
const error = ref<string | null>(null);
const loading = ref(false);
const moreSellerProducts = ref<ProductInterface[]>([]);

const  store_name = ref(props.store_name)

// Price formatting utility
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol',
  }).format(price / 100);
};

const loadMoreSellerProducts = async () => {
  try {
    error.value = null;
    loading.value = true;

    if (!store_name.value) {
      error.value = 'No seller ID provided';
      return;
    }

    moreSellerProducts.value = await productStore.getProductsByStoreName(store_name.value)
  } catch (err) {
    error.value = 'Failed to load products from this seller';
    console.error('Products by seller error:', err);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.store_name,
  (newSellerId) => {
    if (newSellerId) {
      loadMoreSellerProducts();
    } else {
      moreSellerProducts.value = [];
      error.value = null;
    }
  },
  { immediate: true }
);


</script>