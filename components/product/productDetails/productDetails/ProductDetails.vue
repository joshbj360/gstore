<template>
  <div class="flex flex-col bg-neutral-50 dark:bg-neutral-950 h-full overflow-hidden">

    <!-- CONTENT -->
    <div class="flex-1 overflow-y-auto px-4 md:px-6 pb-28">

      <!-- Seller Info -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <NuxtLink
            v-if="sellerStore?.store_name"
            :to="`/seller/profile/${sellerStore.store_slug}`"
            class="flex items-center gap-3"
          >
            <img
              :src="sellerStore.store_logo || '/default-avatar.png'"
              :alt="sellerStore.store_name || 'Seller'"
              class="w-10 h-10 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
            />
            <div>
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {{ sellerStore.store_name }}
                <Icon
                  v-if="sellerStore.is_verified"
                  name="mdi:check-decagram"
                  size="16"
                  class="inline ml-1 text-brand"
                />
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ sellerStore.store_location }}</p>
            </div>
          </NuxtLink>
        </div>

        <button
          v-if="userStore.isLoggedIn && userStore.userProfile?.id !== product.sellerId && !isFollowing && sellerStore?.id"
          @click="followStore.toggleFollow(sellerStore.id)"
          class="border text-xs px-3 py-1 rounded-full transition-all"
          :class="isFollowing 
            ? 'bg-brand/10 text-brand border-[#f02c56]/30'
            : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
        >
          {{ isFollowing ? 'Following' : 'Follow' }}
        </button>
      </div>

      <!-- Title and Price -->
      <h1 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">{{ product.title }}</h1>
      <div class="flex items-baseline mb-3">
        <span class="text-2xl font-semibold text-brand">{{ formatPrice(priceComputed) }}</span>
        <span
          v-if="product.discount"
          class="ml-3 text-sm line-through text-neutral-400"
        >
          {{ formatPrice(product.price) }}
        </span>
      </div>

      <!-- Shipping Info -->
      <div class="flex items-center mb-6 text-sm text-neutral-700 dark:text-neutral-300">
        <Icon name="mdi:truck-fast-outline" class="text-brand mr-2" size="18" />
        <span>Ships in 5–11 days • {{ formatPrice(shippingCost) }}</span>
      </div>

      <!-- Variant Selector -->
      <div v-if="product.variants && product.variants?.length > 1" class="mb-6">
        <label class="block text-xs font-medium mb-2 text-neutral-600 dark:text-neutral-300">Select Size</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="variant in product.variants"
            :key="variant.id"
            @click="selectVariant(variant)"
            :disabled="variant.stock === 0"
            class="px-4 py-1.5 rounded-full border text-xs font-medium transition-all"
            :class="[
              selectedVariant?.id === variant.id
                ? 'bg-brand text-white border-[#f02c56]'
                : 'border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-300 hover:border-neutral-500',
              variant.stock === 0 ? 'opacity-50 cursor-not-allowed line-through' : ''
            ]"
          >
            {{ variant.size }}
          </button>
        </div>
      </div>

      <!-- Description -->
      <div class="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <AccordionItem title="Description" start-open>
          <div v-html="product.description" class="prose-sm max-w-none dark:prose-invert"></div>
        </AccordionItem>

        <AccordionItem v-if="hasMeasurements" title="Specifications">
          <ul class="list-disc pl-4 space-y-1">
            <li v-if="product.measurement?.length"><strong>Length:</strong> {{ product.measurement.length }} cm</li>
            <li v-if="product.measurement?.width"><strong>Width:</strong> {{ product.measurement.width }} cm</li>
            <li v-if="product.measurement?.height"><strong>Height:</strong> {{ product.measurement.height }} cm</li>
            <li v-if="product.measurement?.weight"><strong>Weight:</strong> {{ product.measurement.weight }} kg</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Shipping & Returns">
          <p>Free returns within 30 days. Read our full policy in the footer.</p>
        </AccordionItem>
      </div>
    </div>

    <!-- ACTION BAR -->
    <div class="sticky bottom-0 left-0 right-0 z-10 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-3">
      <div class="flex items-center justify-between gap-3">
        <!-- Quantity -->
        <div class="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-full">
          <button
            @click="quantity > 1 && quantity--"
            class="px-3 py-2 text-neutral-500 dark:text-neutral-400"
          >
            <Icon name="mdi:minus" size="16" />
          </button>
          <span class="px-3 text-sm font-medium text-neutral-800 dark:text-neutral-200">{{ quantity }}</span>
          <button
            @click="quantity++"
            class="px-3 py-2 text-neutral-500 dark:text-neutral-400"
          >
            <Icon name="mdi:plus" size="16" />
          </button>
        </div>

        <!-- Add to Cart -->
        <button
          @click="addToCart"
          :disabled="isInCart"
          class="flex-1 bg-brand text-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-full py-2 text-sm font-medium hover:bg-brand-light dark:hover:bg-neutral-700 transition-all"
        >
          {{ isInCart ? 'Added' : 'Add to Cart' }}
        </button>

        <!-- Buy Now -->
        <button
          @click="buyNow"
          class="flex-1 bg-brand text-white rounded-full py-2 text-sm font-medium hover:bg-brand-light transition-all"
        >
          Buy Now
        </button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, toRefs, type PropType, onMounted } from 'vue';
import type { IProduct, IProductVariant, ISellerProfile } from '~/models';
import { useCartStore, useUserStore, useFollowStore } from '~/stores';
import { notify } from '@kyvg/vue3-notification';
import { useRouter } from 'vue-router';
import AccordionItem from '~/components/shared/AccordionItem.vue';
import { formatPrice } from '~/utils/formatters';

const props = defineProps({
  product: {
    type: Object as PropType<IProduct>,
    required: true
  },
  sellerStore: {
    type: Object as PropType<Partial<ISellerProfile>>,
    required: true
  }
})

const { product, sellerStore } = toRefs(props);
const router = useRouter();
const cartStore = useCartStore();
const userStore = useUserStore();
const followStore = useFollowStore();

const quantity = ref(1);
const selectedVariant = ref<IProductVariant | null>(null);
const variantError = ref('');

const isFollowing = computed(() => followStore.followedSellerIds.has(props.product.sellerId));

const priceComputed = computed(() => {
  const basePrice = selectedVariant.value?.price ?? product.value.price;
  return product.value.discount ? basePrice * (1 - product.value.discount) : basePrice;
});

const hasMeasurements = computed(() => product.value.measurement && Object.values(product.value.measurement).some(v => v));

const selectVariant = (variant: IProductVariant) => {
  selectedVariant.value = variant;
  variantError.value = '';
};

const validateSelection = (): boolean => {
  if ((product.value.variants?.length ?? 0) > 0 && !selectedVariant.value) {
    variantError.value = 'Select a size.';
    notify({ type: 'warn', text: 'Please select a size.' });
    return false;
  }
  if (!selectedVariant.value) {
    notify({ type: 'error', text: 'This product is currently unavailable.' });
    return false;
  }
  if (selectedVariant.value.stock === 0) {
    notify({ type: 'error', text: 'Selected variant is out of stock.' });
    return false;
  }
  return true;
};

const shippingCost = computed(() => {
  const zone = sellerStore.value.shippingZones?.find(z => z.id === product.value.shippingZoneId);
  return zone?.rates[0]?.cost || 0;
});

const buyNow = () => {
  if (!validateSelection()) return;
  
  cartStore.addToCart(product.value, selectedVariant.value!, quantity.value);
  cartStore.prepareForCheckout([cartStore.cartItems.find(item => item.id === `${product.value.id}-${selectedVariant.value!.id}`)!]);
  router.push('/shipping/checkout');
};

const addToCart = () => {
  if (!validateSelection()) return;

  cartStore.addToCart(product.value, selectedVariant.value!, quantity.value);
  notify({ type: 'success', text: `${product.value.title} added!` });
};

const isInCart = computed(() => {
  if (!selectedVariant.value) return false;
  const cartId = `${product.value.id}-${selectedVariant.value.id}`;
  return cartStore.cartItems.some(item => item.id === cartId);
});

// Auto-select first available variant on mount
onMounted(() => {
    if (product.value.variants && product.value.variants.length > 0) {
        const firstAvailable = product.value.variants.find(v => v.stock > 0);
        if (firstAvailable) {
            selectedVariant.value = firstAvailable;
        } else {
            selectedVariant.value = product.value.variants[0];
            variantError.value = 'This product is out of stock.';
        }
    } else {
        selectedVariant.value = { id: 0, productId: product.value.id!, size: 'default', stock: 1, price: null };
    }
});
</script>

