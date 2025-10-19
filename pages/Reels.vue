<template>
    <div class="flex items-center justify-center h-screen">
        <p>Loading the feed...</p>
    </div>
</template>

<script setup lang="ts">
import { useProductStore } from '~/stores';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const productStore = useProductStore();
const router = useRouter();

// This ensures that when a user lands here directly, the product feed is loaded.
const { data: products } = await useAsyncData(
    'initial-reels-products',
    () => productStore.ensureInitialProductsLoaded()
);

onMounted(() => {
    // Once the page mounts, find the first product and navigate to its swipeable page.
    if (products.value && products.value.length > 0) {
        router.push(`/product/${products.value[0].slug}`);
    } else {
        // Fallback if no products are found
        router.push('/');
    }
});
</script>
