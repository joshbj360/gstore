<template>
  <div>
    <!-- Loader -->
    <LoadingSpinner v-if="productStore.isLoading && !initialLoadComplete" />

    <!-- Error Message -->
    <div v-else-if="error" class="flex justify-center items-center h-screen">
      <p class="bg-[#f8f0f0] text-[#f02c56] p-4 rounded-lg">{{ error }}</p>
    </div>

    <!-- Product Page -->
    <div
      v-else-if="productStore.currentProduct"
      id="ProductPage"
      class="fixed lg:flex justify-between z-50 top-0 left-0 w-full h-full bg-black lg:overflow-hidden overflow-auto"
      role="region"
      aria-label="Product Viewer"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend.passive="handleTouchEnd"
      @mousedown="handleMouseDown"
      @keydown.left.prevent="showPreviousProduct"
      @keydown.right.prevent="showNextProduct"
    >
      <ProductImagesSection
        :product="productStore.currentProduct"
        :current-image-index="currentImageIndex"
        :active-view="activeView"
        @set-current-image="setCurrentImage"
        @show-previous="showPreviousProduct"
        @show-next="showNextProduct"
        @delete-product="deleteProduct"
      />

      <ProductDetailsSection
        :product="productStore.currentProduct"
        :active-tab="activeTab"
        :active-view="activeView"
        :is-in-cart="isInCart"
        :seller-store="sellerStore"
        :similar-products="similarProducts"
        @set-active-tab="activeTab = $event"
        :loading="loading"
      />

      <ProductNavigationControls
        :active-view="activeView"
        @toggle-view="toggleView"
        @show-previous="showPreviousProduct"
        @show-next="showNextProduct"
      />

      <SwipeHintOverlay v-if="showSwipeHint" @close="showSwipeHint = false" />
    </div>

    <!-- Fallback for no product -->
    <div v-else-if="!productStore.isLoading" class="flex justify-center items-center h-screen">
      <p class="text-gray-500 text-lg">Product not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeMount, onBeforeUnmount, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router';
import { useProductStore, useCartStore, useCoreStore, useUserStore } from '#build/imports';
import ProductImagesSection from '~/components/product/productDetails/mediaSection/ProductImagesSection.vue';
import ProductDetailsSection from '~/components/product/productDetails/productDetails/ProductDetailSection.vue';
import ProductNavigationControls from '@/components/product/ProductNavigationControls.vue';
import SwipeHintOverlay from '~/components/product/productDetails/SwipeHintOverlay.vue';
import LoadingSpinner from '@/components/shared/Loading.vue';
import { defaultSellerProfile, type SellerStoreInterface } from '~/models/interface/auth/user.interface';
import { defaultProduct, type ProductInterface } from '~/models/interface/products/product.interface';
import { notify } from '@kyvg/vue3-notification'


// Stores
const productStore = useProductStore();
const cartStore = useCartStore();
const coreStore = useCoreStore();
const userStore = useUserStore();
const categoryStore = useCategoryStore()

// Router
const route = useRoute();
const router = useRouter();
const productId = ref(Number(route.params.id) || null) 
const similarProducts = ref<ProductInterface[]>([])

// State
const initialLoadComplete = ref(false);
const error = ref<string | null>(null);
const activeView = ref<'product' | 'details'>('product');
const activeTab = ref<'details' | 'similar'>('details');
const currentImageIndex = ref(0);
const showSwipeHint = ref(false);
const touchState = ref({
  isActive: false,
  startX: 0,
  startY: 0,
  startTime: 0,
});
const clickState = ref({
  isActive: false,
  startX: 0,
  startY: 0,
});
const sellerStore = ref<SellerStoreInterface>(defaultSellerProfile);
const isNavigating = ref(false);

// Constants
const loading = ref(false)
const SWIPE_THRESHOLD = 50;
const SWIPE_TIME_THRESHOLD = 300;
const CLICK_MOVE_THRESHOLD = 5;
const SWIPE_HINT_DURATION = 2000;
const NAVIGATION_DEBOUNCE = 300; // ms to debounce navigation
// Computed
const isInCart = computed(() => cartStore.cartItems.some((cartProduct) => cartProduct.id === productId.value));

// Methods
const loadSellerProfile = async () => {
  if (!productStore.currentProduct?.store_name) return;
  // alert( productStore.currentProduct?.store_name);
  try {
    const success = await userStore.fetchSellerStoreByStoreName(productStore.currentProduct.store_name );
    if (success) {
      sellerStore.value = userStore.seller as SellerStoreInterface;
    } else {
      notify({ title: 'Error', text: userStore.error || 'Failed to load seller profile', type: 'error' });
      // error.value = userStore.error || 'Failed to load seller profile';
    }
  } catch (err) {
    notify({ title: 'Error', text: 'Failed to load seller information', type: 'error' });
    console.error('Seller profile error:', err);
  }
};

// Debounced navigation function
const debouncedNavigate = useDebounceFn((direction: -1 | 1) => {
  if (isNavigating.value) return;
  
  isNavigating.value = true;
  const targetId = getAdjacentProductId(direction);
  if (targetId) {
    navigateToProduct(targetId).finally(() => {
      isNavigating.value = false;
    });
  } else {
    isNavigating.value = false;
  }
}, NAVIGATION_DEBOUNCE);


// Touch handlers
const handleTouchStart = (e: TouchEvent) => {
  touchState.value = {
    isActive: true,
    startX: e.touches[0].clientX,
    startY: e.touches[0].clientY,
    startTime: Date.now(),
  };
};;

const handleTouchMove = (e: TouchEvent) => {
  if (!touchState.value.isActive) return;
  
  // Only prevent default if we detect a significant horizontal movement
  if (Math.abs(e.touches[0].clientX - touchState.value.startX) > 10) {
    e.preventDefault();
  }
};
const handleTouchEnd = (e: TouchEvent) => {
  if (!touchState.value.isActive || isNavigating.value) return;

  const { startX, startY, startTime } = touchState.value;
  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;
  const deltaX = startX - endX;
  const deltaY = startY - endY;
  const elapsed = Date.now() - startTime;

  // Reset touch state
  touchState.value.isActive = false;

  // Check if it's a valid swipe
  if (elapsed < SWIPE_TIME_THRESHOLD && 
      (Math.abs(deltaX) > SWIPE_THRESHOLD || Math.abs(deltaY) > SWIPE_THRESHOLD)) {
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe - toggle view
      activeView.value = deltaX > 0 ? 'product' : 'details';
    } else {
      // Vertical swipe - navigate products
      if (deltaY > 0) debouncedNavigate(-1); // Swipe down - previous
      else debouncedNavigate(1); // Swipe up - next
    }
  }
};

// Click handlers
const handleMouseDown = (e: MouseEvent) => {
  clickState.value = {
    isActive: true,
    startX: e.clientX,
    startY: e.clientY,
  };
};

const handleClick = (e: MouseEvent) => {
  if (!clickState.value.isActive || isNavigating.value) return;

  const { startX, startY } = clickState.value;
  const moveX = Math.abs(e.clientX - startX);
  const moveY = Math.abs(e.clientY - startY);

  // Reset click state
  clickState.value.isActive = false;

  // Ignore if movement exceeds threshold
  if (moveX > CLICK_MOVE_THRESHOLD || moveY > CLICK_MOVE_THRESHOLD) return;

  // Only handle side clicks on desktop
  if (window.innerWidth >= 1024) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const thirdWidth = rect.width / 3;

    if (clickX < thirdWidth) debouncedNavigate(-1); // Left side - previous
    else if (clickX > thirdWidth * 2) debouncedNavigate(1); // Right side - next
  }
};

const showPreviousProduct = () => {
  const prevId = getAdjacentProductId(-1);
  if (prevId) navigateToProduct(prevId);
};

const showNextProduct = () => {
  const nextId = getAdjacentProductId(1);
  if (nextId) navigateToProduct(nextId);
};

const getAdjacentProductId = (direction: -1 | 1): number | null => {
  const products = productStore.getProductsByCategory(productStore.currentCategory);
  if (!products.length) return null;
  
  const currentIndex = products.findIndex((p) => p.id === productId.value);
  if (currentIndex === -1) return null;
  
  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= products.length) return null;
  
  return products[newIndex].id  || null
};


// Navigation functions
const navigateToProduct = async (id: number) => {
  await router.push(`/product/${id}`);
  currentImageIndex.value = 0;
  window.scrollTo(0, 0); // Ensure we're at the top of the page
};

const loadProduct = async () => {
  try {
    error.value = null;
    if (productId.value)     await productStore.getProductById(productId.value);
    console.log(productStore.currentProduct)
    if (!productStore.currentProduct) {
      notify({ title: 'Error', text: 'Product not found', type: 'error' });
    }

  } catch (err) {
    notify({ title: 'Error', text: 'Failed to load product details', type: 'error' });
    console.error('Product load error:', err);
  }
};

const deleteProduct = async () => {
  if (!userStore.isLoggedIn || !userStore.isSeller || 
      userStore.userProfile?.id !== productStore.currentProduct?.sellerId) {
    error.value = 'You do not have permission to delete this product';
    return;
  }

  if (confirm('Are you sure you want to permanently delete this product?')) {
    try {
      error.value = null;
      await $fetch(`/api/prisma/products/delete-product/${productId.value}`, { 
        method: 'DELETE' 
      });
      router.push('/');
    } catch (err) {
      error.value = 'Failed to delete product';
      console.error('Delete error:', err);
    }
  }
};

const setCurrentImage = (index: number) => {
  currentImageIndex.value = index;
};

const toggleView = () => {
  activeView.value = activeView.value === 'product' ? 'details' : 'product';
};

// Lifecycle
onMounted(() => {
  if (coreStore.isFirstMount) {
    showSwipeHint.value = true;
    setTimeout(() => {
      showSwipeHint.value = false;
      coreStore.isFirstMount = false;
    }, SWIPE_HINT_DURATION);
  }
  
  // Prevent background scrolling when modal is open
  document.body.style.overflow = 'hidden';
  document.body.style.touchAction = 'none';

});

onBeforeMount(async () => {
  await Promise.all([
    loadProduct(),
    
  ]);
  // await loadSellerProfile();
  initialLoadComplete.value = true;
});

onBeforeUnmount(() => {
  // Restore scrolling
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
});

// Watchers
watch(
  () => route.params.id,
  useDebounceFn(async (newId) => {
    productId.value = Number(newId);
    await Promise.all([
      loadProduct(),
    ]);
    await loadSellerProfile();
    currentImageIndex.value = 0;
  }, 300)
);

watch(
  () => productStore.currentProduct,
  (newProduct) => {
    if (newProduct) {
      loadSellerProfile();
    }
  }
);

</script>

<style scoped>
#ProductPage {
  touch-action: pan-y;
}

@media (min-width: 1024px) {
  #ProductPage {
    cursor: default;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>