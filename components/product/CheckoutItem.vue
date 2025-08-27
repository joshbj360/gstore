<template>
  <div class="flex justify-start my-2" id="CheckoutItem" role="listitem">
    <img
      :src="item.product.media[0]?.url || 'https://picsum.photos/id/1000/150/150'"
      alt="Product image"
      class="rounded-md md:w-[150px] w-[90px] h-auto object-cover"
      loading="lazy"
      width="150"
      height="150"
      @error="handleError"
    />
    <div class="overflow-hidden pl-2 flex-1">
      <div class="flex items-center">
        <span
          v-if="showWelcomeDeal"
          class="bg-[#C42B78] text-white text-[9px] font-semibold px-2 py-0.5 rounded-md"
        >
          Welcome Deal
        </span>
        <div class="truncate pl-2 flex-1">{{ item.product.title }}</div>
      </div>
      <div class="text-lg font-semibold mt-2">
        $ <span class="font-bold">{{ (item.product.price / 100).toFixed(2) }}</span>
        <span v-if="item.quantity && item.quantity > 1" class="text-sm text-gray-500 ml-2">
          (x{{ item.quantity }})
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CartInterface } from '~/models/interface/cart/cart.interface';


const props = defineProps<{
  item: CartInterface;
  showWelcomeDeal?: boolean;
}>();

const { item } = toRefs(props);
const error = ref(false);

const handleError = () => {
  error.value = true;
};
</script>

<style scoped>
/* No additional styles needed; Tailwind handles responsiveness */
</style>