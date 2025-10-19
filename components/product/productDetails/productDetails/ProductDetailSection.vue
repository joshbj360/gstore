<template>
  <div id="InfoSection" class="relative w-full h-full bg-white overflow-y-auto">
    <ProductTabs @update:active-tab="activeTab = $event">
      
      <!-- Details Tab -->
      <template #details>
        <ProductDetails 
          :product="product"
          :is-in-cart="isInCart"
          :sellerStore="sellerStore"
        />
      </template>
      
      <!-- Similar Products Tab -->
      <template #similar>
        <!-- Show a skeleton loader ONLY while this specific tab is loading -->
        <div v-if="pendingSimilarProducts" class="p-6">
          <ProductGridSkeleton /> 
        </div>
        <div v-else-if="errorSimilarProducts" class="p-8 text-center text-brand">
          Could not load similar products.
        </div>
        <!-- Render the component only AFTER data is ready, passing it as a prop -->
        <SimilarProducts  
          v-else
          :active-tab="activeTab"
          :products="similarProducts"
        />
      </template>

      <!-- More From Seller Tab -->
      <template #seller>
        <div v-if="pendingSellerProducts" class="p-6">
          <ProductGridSkeleton /> 
        </div>
        <div v-else-if="errorSellerProducts" class="p-8 text-center text-brand">
          Could not load seller's products.
        </div>
        <MoreSellerProducts  
          v-else
          :active-tab="activeTab"
          :store_name="product.seller?.store_slug"
          :products="sellerProducts"
        />
      </template>

    </ProductTabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';
import type { IProduct } from '~/models';
import type { ISellerProfile } from '@/models';

// Import Stores and Components
import { useProductStore, useCartStore } from '~/stores';
import ProductTabs from './children/ProductTabs.vue';
import ProductDetails from './children/ProductDetails.vue';
import SimilarProducts from './children/SimilarProducts.vue';
import MoreSellerProducts from './children/MoreSellerProducts.vue';
import ProductGridSkeleton from '~/components/skeletons/ProductGridSkeleton.vue';

const props = defineProps({
  product: {
    type: Object as PropType<IProduct>,
    required: true
  },
  sellerStore: {
    type: Object as PropType<ISellerProfile>,
    required: true,
  },
  isInCart: {
    type: Boolean,
    required: true,
  }
});

const productStore = useProductStore();
const activeTab = ref<'details' | 'similar' | 'seller'>('details');

// --- State for Similar Products Tab ---
const similarProducts = ref<IProduct[]>([]);
const pendingSimilarProducts = ref(false);
const errorSimilarProducts = ref<string | null>(null);

// --- State for Seller Products Tab ---
const sellerProducts = ref<IProduct[]>([]);
const pendingSellerProducts = ref(false);
const errorSellerProducts = ref<string | null>(null);

// This function fetches data for the "Similar Products" tab
const loadSimilarProducts = async () => {
    // Only fetch if the data hasn't been loaded yet
    if (similarProducts.value.length > 0) return;
    
    pendingSimilarProducts.value = true;
    errorSimilarProducts.value = null;
    try {
        const result = await productStore.fetchAndCacheSimilarProducts(props.product.id);
        similarProducts.value = result;
    } catch (e) {
        errorSimilarProducts.value = "Failed to load similar products.";
    } finally {
        pendingSimilarProducts.value = false;
    }
};

// This function fetches data for the "More from Seller" tab
const loadSellerProducts = async () => {
    if (sellerProducts.value.length > 0) return;

    pendingSellerProducts.value = true;
    errorSellerProducts.value = null;
    try {
      if (props.product?.seller?.store_slug) {
        const result = await productStore.getProductsByStoreSlug(props.product?.seller?.store_slug);
        sellerProducts.value = result;
      }
        
    } catch (e) {
        errorSellerProducts.value = "Failed to load seller's products.";
    } finally {
        pendingSellerProducts.value = false;
    }
};

// This watcher triggers the data fetching only when a tab is clicked for the first time
watch(activeTab, (newTab) => {
    if (newTab === 'similar') {
        loadSimilarProducts();
    } else if (newTab === 'seller') {
        loadSellerProducts();
    }
});
</script>