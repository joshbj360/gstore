<template>
    <transition enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in" enter-from-class="translate-y-full"
        leave-to-class="translate-y-full">
        <div v-if="isOpen && product"
            class="fixed inset-0 bg-black/50 flex items-end justify-center z-50 lg:items-center" role="dialog"
            aria-modal="true" :aria-label="`Details for ${product.title}`" @click.self="closeModal">
            <div class="bg-white w-full h-full lg:h-auto lg:max-w-2xl lg:rounded-lg lg:shadow-lg overflow-y-auto">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">{{ product.title || 'Product Details' }}</h2>
                    <button @click="closeModal" class="text-gray-500 hover:text-gray-700" aria-label="Close modal">
                        <Icon name="mdi:close" size="20" />
                    </button>
                </div>
                <!-- Content -->
                <ProductDetails :product="product" />
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useProductStore } from '~/stores/product.store';
import ProductImagesSection from '~/components/product/productDetails/mediaSection/ProductImagesSection.vue';
import ProductDetails from '~/components/product/productDetails/productDetails/children/ProductDetails.vue';
import type { ProductInterface } from '~/models/interface/products/product.interface';

const props = defineProps<{
    isOpen: boolean;
    product: ProductInterface
}>();

const emit = defineEmits(['update:isOpen']);

const product = computed(() => {
    return props.product || null;
});

const closeModal = () => {
    emit('update:isOpen', false);
};

// Keyboard accessibility
const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
        closeModal();
    }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
@media (min-width: 1024px) {
    .h-full {
        height: auto;
        max-height: 80vh;
    }
}
</style>