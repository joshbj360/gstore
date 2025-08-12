<template>
  <transition
    enter-active-class="transition-transform duration-500 ease-in-out"
    leave-active-class="transition-transform duration-500 ease-in-out"
    :enter-from-class="isMobile ? 'translate-y-full' : 'translate-x-full'"
    :leave-to-class="isMobile ? 'translate-y-full' : 'translate-x-full'"
  >
    <div
      v-if="isOpen && product"
      class="fixed inset-0 bg-black/30 z-50"
      @click="$emit('close')"
    >
      <div
        class="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col"
        :class="{ 'bottom-0 h-3/4 w-full max-w-full rounded-t-2xl': isMobile }"
        @click.stop
      >
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="font-semibold text-lg">Product Details</h2>
          <button @click="$emit('close')" class="p-2">
            <Icon name="mdi:close" size="24" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <ProductDetailSection
            :product="product"
            :is-in-cart="isInCart"
            :active-view="'details'"
            :active-tab="'details'"
          />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import ProductDetailSection from '~/components/product/productDetails/productDetails/ProductDetailSection.vue';
import { useCartStore } from '~/stores/cart.store';
import { useUserStore } from '~/stores/user.store';
import { defaultSellerProfile } from '~/models/interface/auth/user.interface';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import type { SellerStoreInterface } from '~/models/interface/auth/user.interface';

const props = defineProps<{
  isOpen: boolean;
  product: ProductInterface | null;
}>();

const emit = defineEmits(['close']);
const product = ref<ProductInterface | null>(props.product);

const cartStore = useCartStore();
const userStore = useUserStore();
const sellerStore = ref<SellerStoreInterface>(defaultSellerProfile);
const isMobile = ref(false);

const isInCart = computed(() => {
  if (!props.product) return false;
  return cartStore.cartItems.some(item => item.id === props.product?.id);
});

const loadSellerProfile = async () => {
  if (!props.product?.store_name) return;
  const success = await userStore.fetchSellerStoreByStoreName(props.product.store_name);
  if (success) {
    sellerStore.value = userStore.seller as SellerStoreInterface;
  }
};


onMounted(() => {
  isMobile.value = window.innerWidth < 768;
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768;
  });
});
</script>