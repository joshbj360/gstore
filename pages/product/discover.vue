<template>
  <MainLayout>
    <div class="pt-[80px] w-full md:w-[calc(100%-90px)] max-w-[750px] mx-auto">
      <div v-if="isLoading && !products.length" class="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
      <div v-else-if="error" class="text-center py-10">
        <p class="text-red-500">{{ error }}</p>
      </div>
      <div v-else ref="swipeContainer" class="h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden snap-y snap-mandatory">
        <div v-for="(product, index) in products" :key="product.id" class="h-full w-full flex items-center justify-center snap-start relative">
          <NuxtLink :to="`/product/${product.id}`" class="w-full h-full">
            <div class="w-full h-full relative group">
              <MediaDisplay :product-media="product.media[0]" class="w-full h-full object-contain" />
              <div class="absolute bottom-0 left-0 right-0 text-white z-20 p-6 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg">
                <h3 class="text-lg sm:text-xl font-semibold truncate">{{ product.title || 'Untitled' }}</h3>
                <p class="text-md sm:text-lg font-bold">{{ formatPrice(product.price) }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>
        <div v-if="isLoading" class="h-24 flex items-center justify-center">
           <LoadingSpinner />
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useProductStore } from '~/stores/product.store';
import MainLayout from '~/layouts/MainLayout.vue';
import MediaDisplay from '~/components/product/productDetails/mediaSection/MediaDisplay.vue';
import LoadingSpinner from '~/components/shared/Loading.vue';
import type { IProduct } from '~/models/interface/products/product.interface';

const productStore = useProductStore();
const products = ref<IProduct[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const swipeContainer = ref<HTMLElement | null>(null);

const loadInitialProducts = async () => {
  isLoading.value = true;
  try {
    if (productStore.products.length === 0) {
      await productStore.fetchProducts(1, 10);
    }
    products.value = productStore.products;
  } catch (err) {
    error.value = "Failed to load products.";
  } finally {
    isLoading.value = false;
  }
};

const loadMoreProducts = async () => {
  if (isLoading.value || !productStore.hasMoreProducts) return;
  isLoading.value = true;
  try {
    await productStore.fetchMoreProducts();
    products.value = productStore.products; // The store appends new products
  } catch (err) {
    console.error("Failed to load more products", err);
  } finally {
    isLoading.value = false;
  }
};

const handleScroll = () => {
  const container = swipeContainer.value;
  if (container) {
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 5) { // 5px threshold
      loadMoreProducts();
    }
  }
};

const formatPrice = (price: number) => {
  if (isNaN(price)) return 'N/A';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price / 100);
};

onMounted(() => {
  loadInitialProducts();
  swipeContainer.value?.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  swipeContainer.value?.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.snap-y {
  scroll-snap-type: y mandatory;
}
.snap-start {
  scroll-snap-align: start;
}
</style>