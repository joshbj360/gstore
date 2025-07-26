<template>
  <div class="p-6 md:p-8 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center">
        <NuxtLink :to="`/seller/profile/${sellerStore.store_name}`" class="group relative">
          <div
            class="absolute inset-0 rounded-full bg-gradient-to-br from-[#f02c56]/10 to-[#f02c56]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          </div>
          
          <img 
            :src="sellerStore?.store_logo || 'https://picsum.photos/id/1005/200'" 
            :alt="sellerStore?.store_name || 'User profile'"
            class="rounded-full w-12 h-12 object-cover border border-gray-100 group-hover:border-[#f02c56]/20 transition-all duration-300" 
            
            />
            
        </NuxtLink>
        <div class="ml-4">
          <div class="flex items-center gap-3">
            <span class="text-lg font-medium text-gray-900 tracking-tight">{{ sellerStore?.store_name || 'Unknown Seller'
            }}
            <Icon 
                v-if="sellerStore?.is_verified" 
                name="mdi:check-decagram" 
                size="20" 
                class="ml-2 text-[#f02c56]" 
              />
          </span>
            <button
              v-if="userStore.isLoggedIn"
              class="border text-sm px-4 py-1 border-[#f02c56] text-[#f02c56] hover:bg-[#f02c56]/5 font-medium rounded-md transition-all duration-300 hover:shadow-xs"
              @click="toggleFollow" :class="{ 'bg-[#f02c56]/10 text-[#f02c56]': isFollowing }"
              :disabled="userStore.isLoggedIn || isFollowing" aria-label="Follow seller" :title="isFollowing ? 'Unfollow' : 'Follow'"
              >
              {{ isFollowing ? 'Following' : 'Follow +' }}
            </button>
          </div>
          <div class="flex items-center text-xs text-gray-500 mt-1 tracking-wide">
            <span>{{ sellerStore?.store_description?.substring(0, 50)|| '@unknown' }}</span>
            <span class="mx-2 text-gray-300">|</span>
            <span>{{ sellerStore?.store_location }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2 mb-8">
      <span v-for="tag in product?.tags" :key="tag.id"
        class="text-xs font-medium px-2.5 py-1 bg-[#f02c56]/10 text-[#f02c56] rounded-full">
        #{{ tag.name }}
      </span>
      <span class="flex items-center text-xs text-gray-500 ml-1">
        <Icon name="mdi:music" size="14" class="mr-1.5 opacity-80" />
        Original audio
      </span>
    </div>
    <div v-if="hasMeasurements" class="grid grid-cols-2 gap-3 mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
      <div v-if="product?.measurement?.length" class="text-sm">
        <div class="text-xs font-medium text-gray-400 tracking-wider mb-1">LENGTH</div>
        <div class="font-medium">{{ product.measurement.length }} cm</div>
      </div>
      <div v-if="product?.measurement?.width" class="text-sm">
        <div class="text-xs font-medium text-gray-400 tracking-wider mb-1">WIDTH</div>
        <div class="font-medium">{{ product.measurement.width }} cm</div>
      </div>
      <div v-if="product?.measurement?.height" class="text-sm">
        <div class="text-xs font-medium text-gray-400 tracking-wider mb-1">HEIGHT</div>
        <div class="font-medium">{{ product.measurement.height }} cm</div>
      </div>
      <div v-if="product?.measurement?.weight" class="text-sm">
        <div class="text-xs font-medium text-gray-400 tracking-wider mb-1">WEIGHT</div>
        <div class="font-medium">{{ product.measurement.weight }} kg</div>
      </div>
    </div>
    <div class="mb-8">
      <h1 class="text-2xl md:text-[28px] font-semibold text-gray-900 mb-4 leading-snug tracking-tight">{{ product?.title
      }}</h1>
      <div v-html="product?.description" class="text-[15px] text-gray-600 mb-6 leading-relaxed"></div>
      <div class="flex items-baseline mb-5">
        <span
          class="text-2xl font-bold text-[#f02c56] transform transition-transform duration-300 hover:scale-[1.02]">{{
            formatPrice(Number(priceComputed)) }}</span>
        <span v-if="product?.discount" class="ml-2 text-xs text-gray-400 line-through">{{ (Number(formatPrice(product.price)) *
          1.2).toFixed(2) }}</span>
      </div>
      <div class="flex items-center gap-2 mb-6">
        <span class="text-xs font-medium px-2.5 py-1 bg-[#009A66]/10 text-[#009A66] rounded-full flex items-center">
          <Icon name="mdi:package-variant" size="14" class="mr-1.5" />
          Free DHL Delivery
        </span>
        <span class="text-xs text-gray-400">11-day shipping</span>
      </div>
      <div grid-cols-2 class="grid grid-cols-2 gap-4 mb-6">
        <div v-if="hasSizes" class="mb-8">
          <label class="block text-sm font-medium text-gray-700 mb-3 tracking-wide">SELECT SIZES</label>
          <div class="flex flex-wrap gap-2">
            <button v-for="size in product?.sizes" :key="size" @click="toggleSize(size)" :class="[
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border',
              selectedSizes.includes(size)
                ? 'bg-[#f02c56] text-white border-[#f02c56] shadow-sm'
                : 'bg-white text-gray-800 border-gray-200 hover:border-[#f02c56]/30',
              isInCart ? 'opacity-50 cursor-not-allowed' : ''
            ]" :disabled="isInCart">
              {{ size }}
            </button>
          </div>
        </div>
        <!-- Quantity -->
        <div class="mb-3 sm:mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-3 tracking-wide">QUANTITY</label>
          <div class="flex items-center border border-gray-200 rounded-lg w-fit">
            <button @click="quantity > 1 && quantity--"
              class="px-4 py-2 text-gray-600 hover:text-[#f02c56] transition-all duration-250 disabled:opacity-50"
              :disabled="quantity <= 1" aria-label="Decrease quantity">
              <Icon name="mdi:minus" size="16" />
            </button>
            <span class="px-3 text-sm font-medium">{{ quantity }}</span>
            <button @click="quantity++"
              class="px-4 py-2 text-gray-600 hover:text-[#f02c56] transition-all duration-250"
              aria-label="Increase quantity">
              <Icon name="mdi:plus" size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col sm:flex-row gap-3 mb-8">
      <button
        class="flex-1 bg-gradient-to-r from-[#f02c56] to-[#e6375d] text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-300 font-medium text-sm tracking-wide flex items-center justify-center gap-2">
        <Icon name="mdi:flash" size="18" />
        Buy Now
      </button>
      <button
        class="flex-1 bg-white border border-gray-200 text-gray-800 px-6 py-4 rounded-xl hover:border-[#f02c56]/50 hover:bg-[#ffeef2]/50 transition-all duration-300 font-medium text-sm tracking-wide flex items-center justify-center gap-2"
        @click="addToCartWithSizes" :disabled="isInCart || (hasSizes && !selectedSizes.length)"
        :class="{ 'opacity-50 cursor-not-allowed': isInCart || (hasSizes && !selectedSizes.length), '!border-[#f02c56]/30 !bg-[#ffeef2]/30': isInCart }">
        <Icon :name="isInCart ? 'mdi:check-circle' : 'mdi:cart'" size="18"
          :class="isInCart ? 'text-[#009A66]' : 'text-[#f02c56]'" />
        {{ isInCart ? 'Added to Cart' : 'Add to Cart' }}
      </button>
    </div>
    <div class="flex items-center justify-between mb-8 px-2">
      <button class="flex flex-col items-center group" @click="isLiked = !isLiked">
        <div class="rounded-full p-2.5 group-hover:bg-gray-100/50 transition-colors duration-300">
          <Icon name="mdi:heart" size="20" :class="isLiked ? 'text-[#F02C56] fill-current' : 'text-gray-400'" />
        </div>
        <span class="text-xs mt-1.5 text-gray-500 font-medium">{{ isLiked ? '123' : '122' }}</span>
      </button>
      <button class="flex flex-col items-center group">
        <div class="rounded-full p-2.5 group-hover:bg-gray-100/50 transition-colors duration-300">
          <Icon name="bx:bxs-message-rounded-dots" size="20" class="text-gray-400" />
        </div>
        <span class="text-xs mt-1.5 text-gray-500 font-medium">43</span>
      </button>
      <button class="flex flex-col items-center group">
        <div class="rounded-full p-2.5 group-hover:bg-gray-100/50 transition-colors duration-300">
          <Icon name="mdi:bookmark" size="20" class="text-gray-400" />
        </div>
        <span class="text-xs mt-1.5 text-gray-500 font-medium">Save</span>
      </button>
      <button class="flex flex-col items-center group">
        <a :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`" target="_blank"
          class="rounded-full p-2.5 group-hover:bg-gray-100/50 transition-colors duration-300">
          <Icon name="mdi:facebook" size="20" class="text-gray-400" />
        </a>
        <span class="text-xs mt-1.5 text-gray-500 font-medium">facebook</span>
      </button>
      <button class="flex flex-col items-center group">
        <a :href="`https://www.tiktok.com/share?url=${encodeURIComponent(productUrl)}`" target="_blank"
          class="rounded-full p-2.5 group-hover:bg-gray-100/50 transition-colors duration-300">
          <Icon name="ri:tiktok-fill" size="20" class="text-gray-400" />
        </a>
        <span class="text-xs mt-1.5 text-gray-500 font-medium">tiktok</span>
      </button>
      
      <button class="flex flex-col items-center group">
        <a :href="`https://www.tiktok.com/share?url=${encodeURIComponent(productUrl)}`" target="_blank"
          class="rounded-full p-2.5 group-hover:bg-gray-100/50 transition-colors duration-300">
          <Icon name="mdi:instagram" size="20" class="text-gray-400" />
        </a>
        <span class="text-xs mt-1.5 text-gray-500 font-medium">Instagram</span>
      </button>

    </div>
    <div id="Comments" class="bg-white rounded-xl w-full h-[440px] border border-gray-100 shadow-xs overflow-hidden">
      <Chat />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs, type PropType } from 'vue';
import { defaultProduct, type ProductInterface } from '~/models/interface/products/product.interface';
import Chat from '~/components/product/productDetails/Chat.vue';
import { useCartStore } from '~/stores/cart.store';
import { useUserStore } from '#build/imports';
import  {defaultSellerProfile, type SellerStoreInterface } from '~/models/interface/auth/user.interface';

const props = defineProps({
  product: {
    type: Object as PropType<ProductInterface>,
    default: defaultProduct,
    required: true
  },
  isInCart: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  sellerStore: {
    type: Object as PropType<SellerStoreInterface>,
    default: defaultSellerProfile
    }
})

const { product, isInCart, sellerStore } = toRefs(props);
const cartStore = useCartStore();
const userStore = useUserStore()
const isLiked = ref(true);
const quantity = ref(1);
const selectedSizes = ref<string[]>([]);
const isFollowing = ref(false);
const productUrl = computed(() => `${window.location.origin}/item/${product.value?.id || ''}`);

const priceComputed = computed(() => {
  return product.value?.price ? (product.value.price).toFixed(2) : '0.00';
});

const hasMeasurements = computed(() => {
  return product.value?.measurement && Object.values(product.value.measurement).some((value) => value != null);
});

const hasSizes = computed(() => {
  return product.value?.sizes && product.value.sizes.length > 0;
});

const toggleSize = (size: string) => {
  if (isInCart.value) return;
  if (selectedSizes.value.includes(size)) {
    selectedSizes.value = selectedSizes.value.filter((s) => s !== size);
  } else {
    selectedSizes.value.push(size);
  }
};

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value;
  // Here you would typically call an API to follow/unfollow the seller
};

const addToCartWithSizes = () => {
  if (product.value && !isInCart.value) {
    cartStore.addToCart(product.value, quantity.value, selectedSizes.value);
  }
};
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency:'NGN',
    currencyDisplay: 'narrowSymbol'
    
    
  }).format(price / 100);
};
</script>