<template>
  <transition
    enter-active-class="transition-transform duration-500 ease-in-out"
    leave-active-class="transition-transform duration-500 ease-in-out"
    :enter-from-class="isMobile ? 'translate-y-full' : 'translate-x-full'"
    :leave-to-class="isMobile ? 'translate-y-full' : 'translate-x-full'"
  >
    <div v-if="isOpen && product" class="fixed inset-0 bg-black/30 z-50" @click="$emit('close')">
      <div class="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col" :class="{ 'bottom-0 h-3/4 w-full max-w-full rounded-t-2xl': isMobile }" @click.stop>
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="font-semibold text-lg">Product Details</h2>
          <button @click="$emit('close')" class="p-2 rounded-full hover:bg-gray-100">
            <Icon name="mdi:close" size="24" />
          </button>
        </div>

        <!-- The content now renders instantly with the pre-fetched seller data -->
        <div v-if="sellerStore" class="flex-1 overflow-y-auto">
          <ProductDetailSection
            :product="product"
            :is-in-cart="isInCart"
            :seller-store="sellerStore"
            :active-view="'details'"
            :active-tab="'details'"
          />
        </div>
        <!-- Optional: Show a loading state if the seller data is still being fetched -->
        <!-- <div v-else class="flex-1 flex items-center justify-center">
            <LoadingSpinner />
        </div> -->
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ProductDetailSection from '~/components/product/productDetails/productDetails/ProductDetailSection.vue';
import LoadingSpinner from '~/components/shared/Loading.vue';
import { useCartStore } from '~/stores/cart.store';
import type { IProduct } from '~/models';
import type { ISellerProfile } from '@/models';

const props = defineProps<{
  isOpen: boolean;
  product: IProduct;
  // This component is now "dumb" and receives the seller profile as a prop
  sellerStore: ISellerProfile | null;
}>();

const emit = defineEmits(['close']);

const cartStore = useCartStore();
const isMobile = ref(false);

   const isInCart = computed(() => {
  const productVariantIds = new Set(props.product.variants?.map(v => v.id))
  return cartStore.cartItems.some(item => productVariantIds.has(item.variant.id));
});

onMounted(() => {
  isMobile.value = window.innerWidth < 768;
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768; });
});
</script>