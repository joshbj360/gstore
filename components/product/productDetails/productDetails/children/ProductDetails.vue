<template>
  <div class="p-6 md:p-8 max-w-3xl mx-auto text-neutral-100">
    <!-- Seller Info Block -->
    <div class="flex items-center justify-between mb-6 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
      <div class="flex items-center">
        <NuxtLink v-if="sellerStore?.store_name" :to="`/seller/profile/${sellerStore.store_slug}`"
          class="group relative">
          <img loading="lazy" :src="sellerStore.store_logo || '/default-store-logo.png'"
            :alt="sellerStore.store_name || 'User profile'" class="rounded-full w-12 h-12 object-cover border-2 border-neutral-700" />
        </NuxtLink>
        <div class="ml-4">
          <div class="flex items-center gap-2">
            <span class="text-base font-semibold text-neutral-100">{{ sellerStore.store_name || 'Unknown Seller' }}</span>
            <Icon v-if="sellerStore.is_verified" name="mdi:check-decagram" size="18" class="text-[#f02c56]" />
          </div>
          <p class="text-xs text-neutral-400 mt-1">{{ sellerStore.store_location }}</p>
        </div>
      </div>
      <button v-if="userStore.isLoggedIn" @click="toggleFollow"
        class="border text-sm px-4 py-1.5 font-medium rounded-md transition-all duration-300"
        :class="isFollowing ? 'bg-brand/10 text-[#f02c56] border-brand/30' : 'text-neutral-300 border-neutral-700 hover:bg-neutral-800'">
        {{ isFollowing ? 'Following' : 'Follow' }}
      </button>
    </div>

    <!-- Product Title & Price -->
    <h1 class="text-2xl md:text-3xl font-bold text-neutral-100 mb-2 leading-tight">{{ product.title }}</h1>
    <div class="flex items-baseline mb-4">
      <span class="text-3xl font-bold text-[#f02c56]">{{ formatPrice(priceComputed) }}</span>
      <span v-if="product.discount" class="ml-3 text-base text-neutral-500 line-through">{{ formatPrice(product.price)
        }}</span>
    </div>

    <!-- Shipping Information Section -->
    <div class="mb-6 p-4 bg-blue-900/50 border border-blue-800 rounded-lg flex items-center">
      <Icon name="mdi:truck-fast-outline" size="24" class="text-blue-300 shrink-0" />
      <div class="ml-3">
        <p class="text-sm font-semibold text-blue-200">Shipping: {{ formatPrice(shippingCost) }}</p>
        <p class="text-xs text-blue-300">Estimated delivery: 5-11 days</p>
      </div>
    </div>

    <!-- Variant (Size) Selector -->
    <div v-if="product.variants && product.variants.length > 1" class="mb-6">
      <label class="block text-sm font-medium text-neutral-300 mb-2">Select Size</label>
      <div class="flex flex-wrap gap-2">
        <button v-for="variant in product.variants" :key="variant.id" @click="selectVariant(variant)"
          :disabled="variant.stock === 0" :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border',
            selectedVariant?.id === variant.id
              ? 'bg-brand text-white border-brand shadow-sm'
              : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-neutral-500',
            variant.stock === 0 ? 'opacity-50 cursor-not-allowed bg-neutral-800 line-through' : ''
          ]">
          {{ variant.size }}
        </button>
      </div>
      <p v-if="variantError" class="text-[#f02c56] text-sm mt-2">{{ variantError }}</p>
    </div>

    <!-- Action Block: Quantity, Add to Cart, and Buy Now -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="col-span-1">
        <label class="block text-sm font-medium text-neutral-300 mb-2">Quantity</label>
        <div class="flex items-center border border-neutral-700 rounded-lg w-fit">
          <button @click="quantity > 1 && quantity--" :disabled="quantity <= 1"
            class="px-3 py-2 text-neutral-400 disabled:opacity-50">
            <Icon name="mdi:minus" size="18" />
          </button>
          <span class="px-4 text-sm font-medium text-neutral-100">{{ quantity }}</span>
          <button @click="quantity++" class="px-3 py-2 text-neutral-400">
            <Icon name="mdi:plus" size="18" />
          </button>
        </div>
      </div>
      <button @click="addToCart" :disabled="isInCart"
        class="col-span-1 bg-neutral-800 border border-neutral-700 text-neutral-200 h-full py-2 rounded-xl hover:bg-neutral-700 transition-all font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-70">
        <Icon :name="isInCart ? 'mdi:check-circle' : 'mdi:cart-plus'" size="20" />
        {{ isInCart ? 'Added' : 'Add to Cart' }}
      </button>
      <button @click="buyNow"
        class="col-span-1 bg-brand text-white h-full py-2 rounded-xl hover:bg-[#d81b36] transition-all font-medium text-sm flex items-center justify-center gap-2">
        <Icon name="mdi:flash" size="20" />
        Buy Now
      </button>
    </div>

    <!-- Collapsible Information Sections -->
    <div class="space-y-2">
      <AccordionItem title="Description" start-open>
        <div v-html="product.description" class="prose prose-sm prose-invert max-w-none text-neutral-300"></div>
      </AccordionItem>
      <AccordionItem v-if="hasMeasurements" title="Specifications & Measurements">
        <ul class="list-disc pl-5 text-neutral-300">
          <li v-if="product.measurement?.length"><strong>Length:</strong> {{ product.measurement.length }} cm</li>
          <li v-if="product.measurement?.width"><strong>Width:</strong> {{ product.measurement.width }} cm</li>
          <li v-if="product.measurement?.height"><strong>Height:</strong> {{ product.measurement.height }} cm</li>
          <li v-if="product.measurement?.weight"><strong>Weight:</strong> {{ product.measurement.weight }} kg</li>
        </ul>
      </AccordionItem>
      <AccordionItem title="Shipping & Returns">
        <p class="text-neutral-300">We offer competitive shipping rates and a 30-day return policy for unused items in their original packaging.
          Please see our full policy for more details.</p>
      </AccordionItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs, type PropType } from 'vue';
import type { IProduct, IProductVariant, ISellerProfile } from '~/models';
import { useCartStore, useUserStore } from '~/stores';
import AccordionItem from '~/components/shared/AccordionItem.vue';
import { notify } from "@kyvg/vue3-notification";
import { useRouter } from 'vue-router'; // Import useRouter

const props = defineProps({
  product: {
    type: Object as PropType<IProduct>,
    required: true
  },
  sellerStore: {
    type: Object as PropType<ISellerProfile>,
    required: true
  }
});

const { product, sellerStore } = toRefs(props);
const router = useRouter(); // Initialize router
const cartStore = useCartStore();
const userStore = useUserStore();

const quantity = ref(1);
const selectedVariant = ref<IProductVariant | null>(null);
const variantError = ref('');
const isFollowing = ref(false);

const priceComputed = computed(() => {
  return selectedVariant.value?.price || product.value.price;
});

const hasMeasurements = computed(() => {
  return product.value.measurement && Object.values(product.value.measurement).some((value) => value);
});

const selectVariant = (variant: IProductVariant) => {
  selectedVariant.value = variant;
  variantError.value = '';
};

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value;
};

const validateSelection = (): boolean => {
  if (product.value.variants?.length && !selectedVariant.value) {
    variantError.value = 'Please select a size.';
    notify({ type: 'warn', text: 'Please select a size.' });
    return false;
  }
  if (!selectedVariant.value) {
    notify({ type: 'error', text: 'This product is currently unavailable.' });
    return false;
  }
  return true;
};

const shippingCost = computed(() => {
  if (!product.value.shippingZoneId || !sellerStore.value.shippingZones) {
    return 0;
  }
  const zone = sellerStore.value.shippingZones.find(z => z.id === product.value.shippingZoneId);
  return zone?.rates[0]?.cost || 0;
});

const buyNow = () => {
    if (!validateSelection()) return;

    if (!isInCart.value) {
      cartStore.addToCart(product.value, selectedVariant.value!, quantity.value);
    }
    cartStore.prepareForCheckout([cartStore.cartItems.find(item => item.id === `${product.value.id}-${selectedVariant.value!.id}`)!]);
    router.push('/shipping/checkout');
  };

const addToCart = () => {
  if (product.value.variants?.length && !selectedVariant.value) {
    variantError.value = 'Please select a size.';
    notify({ type: 'warn', text: 'Please select a size before adding to cart.' });
    return;
  }
  
  if (!selectedVariant.value) {
    notify({ type: 'error', text: 'This product is currently unavailable.' });
    return;
  }
  cartStore.addToCart(product.value, selectedVariant.value, quantity.value);
  notify({ type: 'success', text: `${product.value.title} (${selectedVariant.value.size}) added to cart!` });
};

const isInCart = computed(() => {
  if (!selectedVariant.value) return false;
  const cartId = `${product.value.id}-${selectedVariant.value.id}`;
  return cartStore.cartItems.some(item => item.id === cartId);
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price / 100);
};

// Auto-select the first available variant on component load
if (props.product.variants && props.product.variants.length > 0) {
  const firstAvailableVariant = props.product.variants.find(v => v.stock > 0);
  if (firstAvailableVariant) {
    selectedVariant.value = firstAvailableVariant;
  }
} else {
    // Handle products with no variants by creating a default "dummy" variant
    selectedVariant.value = { id: 0, productId: props.product.id!, size: 'default', stock: 1, price: null };
}
</script>

