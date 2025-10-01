<template>
    <!-- 
      THE FIX: This is now a flex container.
      - `h-full` makes it fill its parent grid cell.
      - `flex-col` arranges its children (header and content) vertically.
    -->
    <div v-if="product" class="h-full flex flex-col bg-white rounded-2xl shadow-xl text-black">
        <!-- Tabs (This part will not scroll) -->
        <div class="flex border-b shrink-0">
            <button @click="activeTab = 'details'" :class="tabClass('details')">Details</button>
            <button @click="activeTab = 'chat'" :class="tabClass('chat')">Chat</button>
        </div>

        <!-- 
          THE FIX: This is the scrollable content area.
          - `flex-1` tells it to take up all available vertical space.
          - `overflow-y-auto` creates the scrollbar only when needed.
          - `min-h-0` is a crucial piece that allows the container to shrink and enable scrolling.
        -->
        <div class="flex-1 overflow-y-auto min-h-0">
            <div v-if="activeTab === 'details'">
                <ProductDetails 
                    v-if="sellerStore"
                    :product="product"
                    :sellerStore="sellerStore"
                />
                <div v-else class="p-8 text-center text-gray-500">Loading seller info...</div>
            </div>
            <div v-if="activeTab === 'chat'">
                <div class="p-6 text-center">
                    <p class="text-gray-600">Chat with {{ sellerStore?.store_name || 'the seller' }}.</p>
                    <p class="text-xs text-gray-400 mt-2">(Chat functionality coming soon)</p>
                </div>
            </div>
        </div>
    </div>
    <!-- Fallback for when no product is selected -->
    <div v-else class="h-full bg-white rounded-2xl shadow-xl flex items-center justify-center text-gray-500">
        <p>Swipe to view products.</p>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { IProduct, ISellerProfile } from '~/models';
import ProductDetails from '~/components/product/productDetails/productDetails/children/ProductDetails.vue';

const props = defineProps<{
  product: IProduct | null;
  sellerStore: ISellerProfile | null;
}>();

const activeTab = ref<'details' | 'chat'>('details');

const tabClass = (tabName: 'details' | 'chat') => {
    return [
        'flex-1 py-3 text-center font-semibold text-sm transition-colors',
        activeTab.value === tabName
            ? 'text-[#f02c56] border-b-2 border-[#f02c56]'
            : 'text-gray-500 hover:text-gray-800'
    ];
};
</script>

