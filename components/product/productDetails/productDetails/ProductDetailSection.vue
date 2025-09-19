<template>
  <div
    id="InfoSection"
    class=" relative w-full h-full bg-white overflow-y-auto"
  >
    <!-- <ProductQuickNavigation /> -->
    
    <ProductTabs
      @update:active-tab="activeTab = $event"
    >
      <template #details>
        <ProductDetails 
          :product="product"
          :is-in-cart="isInCart"
          :sellerStore="sellerStore"
        />
      </template>
      
      <template #similar>
        <SimilarProducts  
          :active-tab="activeTab"
          :productId="product.id"
        />
      </template>
      <template #seller>
        <MoreSellerProduct  
          :active-tab="activeTab"
          :product-id="product.id"
          :store_name="product.store_name"
        />
      </template>
    </ProductTabs>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { ProductInterface } from '~/models/interface/products/product.interface';

import ProductQuickNavigation from '~/components/product/productDetails/productDetails/children/ProductQuickNavigation.vue';
import ProductTabs from '~/components/product/productDetails/productDetails/children/ProductTabs.vue';
import ProductDetails from '~/components/product/productDetails/productDetails/children/ProductDetails.vue';
import SimilarProducts from '~/components/product/productDetails/productDetails/children/SimilarProducts.vue'
import MoreSellerProduct from '~/components/product/productDetails/productDetails/children/MoreSellerProducts.vue'
import seller from '~/middleware/seller';
import type { SellerStoreInterface } from '~/models/interface/auth/user.interface';


const props = defineProps({
  product: {
    type: Object as PropType<ProductInterface>,
    required: true
  },
  sellerStore: {
    type: Object as PropType<SellerStoreInterface>,
    required: true,
    default: () => ({})
  },
  activeTab: {
    type: String as PropType<'details' | 'similar' | 'seller'>,
    required: true,
    default: 'details'
  },
  activeView: {
    type: String as PropType<'product' | 'details'>,
    required: true
  },
  isInCart: {
    type: Boolean,
    required: true,
    default: false
  }
});

const activeTab = ref(props.activeTab);
const product = ref(props.product)

watch(activeTab, (newValue) => {
  console.log(`Active tab has been changed to: ${newValue}`); // TODO remove this line in production
  console.log(product.value.sellerId)
});



</script>