<template>
  <div class="p-6 md:p-8 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <NuxtLink v-if="sellerStore?.store_name" :to="`/seller/profile/${sellerStore.store_name}`" class="group relative">
          <img loading="lazy" :src="sellerStore.store_logo || 'https://picsum.photos/id/1005/200'" :alt="sellerStore.store_name || 'User profile'"
            class="rounded-full w-12 h-12 object-cover border" />
        </NuxtLink>
        <div class="ml-4">
          <div class="flex items-center gap-3">
            <span class="text-lg font-medium text-gray-900">{{ sellerStore.store_name || 'Unknown Seller' }}</span>
            <Icon v-if="sellerStore.is_verified" name="mdi:check-decagram" size="20" class="text-brand-dark" />
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ sellerStore.store_location }}</p>
        </div>
      </div>
      <button v-if="userStore.isLoggedIn" @click="toggleFollow"
        class="border text-sm px-4 py-1.5 font-medium rounded-md transition-all duration-300"
        :class="isFollowing ? 'bg-brand/10 text-brand-dark' : 'text-gray-700 hover:bg-gray-50'">
        {{ isFollowing ? 'Following' : 'Follow' }}
      </button>
    </div>

    <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">{{ product.title }}</h1>
    <div class="flex items-baseline mb-6">
        <span class="text-2xl font-bold text-brand-dark">{{ formatPrice(priceComputed) }}</span>
        <span v-if="product.discount" class="ml-3 text-base text-gray-400 line-through">{{ formatPrice(product.price) }}</span>
    </div>

    <div v-if="product.variants && product.variants.length" class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Select Size</label>
      <div class="flex flex-wrap gap-2">
        <button v-for="variant in product.variants" :key="variant.id" @click="selectVariant(variant)"
          :disabled="variant.stock === 0"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border',
            selectedVariant?.id === variant.id
              ? 'bg-brand text-white border-[#C42B78] shadow-sm'
              : 'bg-white text-gray-800 border-gray-200 hover:border-gray-400',
            variant.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100 line-through' : ''
          ]">
          {{ variant.size }}
        </button>
      </div>
       <p v-if="variantError" class="text-red-500 text-sm mt-2">{{ variantError }}</p>
    </div>

    <div class="flex items-end gap-4 mb-8">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <div class="flex items-center border border-gray-200 rounded-lg w-fit">
                <button @click="quantity > 1 && quantity--" :disabled="quantity <= 1" class="px-3 py-2 text-gray-600 disabled:opacity-50">
                    <Icon name="mdi:minus" size="18" />
                </button>
                <span class="px-4 text-sm font-medium">{{ quantity }}</span>
                <button @click="quantity++" class="px-3 py-2 text-gray-600">
                    <Icon name="mdi:plus" size="18" />
                </button>
            </div>
        </div>
        <button @click="addToCart" :disabled="isInCart" class="flex-1 bg-brand text-white h-full px-6 py-3 rounded-xl hover:bg-[#e6375d] transition-all font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-70">
            <Icon :name="isInCart ? 'mdi:check-circle' : 'mdi:cart-plus'" size="20" />
            {{ isInCart ? 'Added to Cart' : 'Add to Cart' }}
        </button>
    </div>

    <div class="space-y-2">
        <AccordionItem title="Description" start-open>
            <div v-html="product.description" class="text-gray-600"></div>
        </AccordionItem>
        <AccordionItem v-if="hasMeasurements" title="Specifications & Measurements">
            <ul>
                <li v-if="product.measurement?.length"><strong>Length:</strong> {{ product.measurement.length }} cm</li>
                <li v-if="product.measurement?.width"><strong>Width:</strong> {{ product.measurement.width }} cm</li>
                <li v-if="product.measurement?.height"><strong>Height:</strong> {{ product.measurement.height }} cm</li>
                <li v-if="product.measurement?.weight"><strong>Weight:</strong> {{ product.measurement.weight }} kg</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="Shipping & Returns">
            <p>Free 11-day shipping via DHL. We also offer a 30-day return policy for unused items in their original packaging. Please see our full policy for more details.</p>
        </AccordionItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs, type PropType } from 'vue';
import { type ProductInterface, type ProductVariantInterface, defaultProduct } from '@/models/interface/products/product.interface';
import { type SellerStoreInterface } from '@/models/interface/auth/user.interface';
import { useCartStore } from '@/stores/cart.store';
import { useUserStore } from '@/stores/user.store';
import AccordionItem from '~/components/shared/AccordionItem.vue';
import { notify } from "@kyvg/vue3-notification";

const props = defineProps({
  product: {
    type: Object as PropType<ProductInterface>,
    default: () => defaultProduct,
    required: true
  },
  isInCart: {
    type: Boolean,
    default: false
  },
  sellerStore: {
    type: Object as PropType<SellerStoreInterface>,
    required: true
  }
});

const { product, sellerStore } = toRefs(props);
const cartStore = useCartStore();
const userStore = useUserStore();

const quantity = ref(1);
// FIX: This now holds the entire selected variant object, not just a string.
const selectedVariant = ref<ProductVariantInterface | null>(null);
const variantError = ref('');
const isFollowing = ref(false);

// FIX: The price now intelligently uses the selected variant's price if it exists.
const priceComputed = computed(() => {
  return selectedVariant.value?.price || product.value.price;
});

const hasMeasurements = computed(() => {
  return product.value.measurement && Object.values(product.value.measurement).some((value) => value);
});

// FIX: This function now accepts and sets the full variant object.
const selectVariant = (variant: ProductVariantInterface) => {
  selectedVariant.value = variant;
  variantError.value = ''; // Clear any previous error message.
};

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value;
};

// FIX: The addToCart function now passes the full variant object to the cart store.
const addToCart = () => {
  // 1. Check if a variant selection is required but hasn't been made.
  if (product.value.variants?.length && !selectedVariant.value) {
    variantError.value = 'Please select a size.';
    notify({ type: 'warn', text: 'Please select a size before adding to cart.' });
    return;
  }
  
  // 2. Ensure we have a variant to add. For products with one variant, you might pre-select it.
  if (!selectedVariant.value) {
      notify({ type: 'error', text: 'This product is currently unavailable.' });
      return;
  }

  // 3. Add the specific variant to the cart.
  cartStore.addToCart(product.value, selectedVariant.value, quantity.value);
  notify({ type: 'success', text: `${product.value.title} (${selectedVariant.value.size}) added to cart!` });
};

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
}
</script>