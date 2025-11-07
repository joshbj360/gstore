<template>
    <div class="space-y-6">
        <h3 class="font-bold text-gray-800 dark:text-neutral-200">Shop the Look</h3>
        
        <div v-if="pending" class="space-y-3">
            <!-- Skeleton Loader -->
            <div v-for="i in 2" :key="i" class="flex items-center space-x-3 p-2 animate-pulse">
                <div class="w-16 h-16 rounded-md bg-gray-200 dark:bg-neutral-800"></div>
                <div class="flex-1 space-y-2">
                    <div class="h-4 w-3/4 bg-gray-200 dark:bg-neutral-800 rounded"></div>
                    <div class="h-4 w-1/2 bg-gray-300 dark:bg-neutral-700 rounded"></div>
                </div>
            </div>
        </div>

        <div v-else-if="accessories && accessories.length > 0" class="space-y-3">
            <NuxtLink 
                v-for="acc in accessories" 
                :key="acc.id" 
                :to="`/product/${acc.slug}`"
                class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
                <img 
                    :src="acc?.media[0]?.url || '/default-product.png'" 
                    alt="Accessory" 
                    class="w-16 h-16 rounded-md object-cover flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">{{ acc.title }}</p>
                    <p class="text-xs text-gray-500 dark:text-neutral-400">{{ formatPrice(acc.price) }}</p>
                </div>
            </NuxtLink>
        </div>

        <div v-else class="text-sm text-gray-500 dark:text-neutral-500 text-center py-4">
            No accessories linked to this item.
        </div>
    </div>
</template>

<script setup lang="ts">
import type { IProduct } from '~/models';
import { useApiService } from '~/services/api/apiService';
import { formatPrice } from '~/utils/formatters';

const props = defineProps<{
    productId: number;
}>();

const apiService = useApiService();


// This component fetches its own data based on the product ID prop.
const { data: accessories, pending } = await useAsyncData(
    `linked-accessories-${props.productId}`,
    () => apiService.getLinkedAccessories(props.productId),
    { lazy: true }
);

</script>
