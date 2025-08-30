<template>
  <UploadLayout>
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
      <LoadingSpinner />
    </div>

    <div v-else-if="productToEdit" class="w-full mt-16 mb-12 bg-white shadow-xl rounded-2xl">
      <div class="p-6 md:p-8 border-b border-gray-200">
        <h1 class="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p class="text-gray-500 text-sm mt-1">Make changes to your product listing and save them.</p>
      </div>

      <div class="p-6 md:p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="space-y-6">
            <h2 class="text-lg font-semibold text-gray-800">Media Manager</h2>
            <div class="bg-gray-50 p-6 rounded-lg border border-dashed">
              <UploadWidget 
                :sellerId="userStore.user?.id ?? ''" 
                @upload-complete="handleMediaUpload" 
              />
            </div>
            <MediaPreview 
              v-if="mediaData.length" 
              :media="mediaData" 
              @remove="removeMedia" 
              @set-main="setMainDisplay" 
            />
          </div>

          <div>
            <ProductForm 
              :media-data="mediaData"
              :existing-product="productToEdit"
              @submit="saveProduct"
              @discard="router.back()"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-20">
        <h2 class="text-xl font-semibold">Product not found</h2>
        <p class="text-gray-500 mt-2">The product you are trying to edit does not exist.</p>
        <NuxtLink to="/seller/dashboard" class="mt-4 inline-block text-brand-dark hover:underline">
            Return to Dashboard
        </NuxtLink>
    </div>
  </UploadLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore, useUserStore } from '~/stores';
import { notify } from "@kyvg/vue3-notification";

// Component Imports
import UploadLayout from '~/layouts/UploadLayout.vue';
import LoadingSpinner from '~/components/shared/Loading.vue';
import ProductForm from '~/components/upload/ProductForm.vue';
import MediaPreview from '~/components/shared/MediaPreview.vue';
import UploadWidget from '~/components/upload/UploadWidget.vue';

import type { MediaInterface } from '~/models/interface/products/media.interface';
import type { ProductInterface } from '~/models/interface/products/product.interface';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const userStore = useUserStore();

const isLoading = ref(true);
const productToEdit = ref<ProductInterface | null>(null);
const mediaData = ref<MediaInterface[]>([]);

onMounted(async () => {
  const productId = Number(route.params.id);
  if (isNaN(productId)) {
    router.push('/seller/dashboard');
    return;
  }
  
  try {
    const product = await productStore.getProductById(productId);

    // --- SECURITY CHECK ---
    // Ensure the user is logged in and is the owner of the product
    if (!userStore.isLoggedIn || userStore.user?.id !== product?.sellerId) {
        notify({ type: 'error', text: "You don't have permission to edit this product." });
        router.push('/');
        return;
    }

    if (product) {
        productToEdit.value = product;
        mediaData.value = [...product.media]; // Create a mutable copy
    }
  } catch (error) {
    notify({ type: 'error', text: 'Failed to load product data.' });
  } finally {
    isLoading.value = false;
  }
});

const handleMediaUpload = (uploadedMedia: MediaInterface[]) => {
  mediaData.value.push(...uploadedMedia);
};

const removeMedia = (index: number) => {
  mediaData.value.splice(index, 1);
};

const setMainDisplay = (index: number) => {
  const mainMedia = mediaData.value.splice(index, 1)[0];
  mediaData.value.unshift(mainMedia);
};

const saveProduct = async (updatedProductData: ProductInterface) => {
    isLoading.value = true;
    try {
        const payload = {
            ...updatedProductData,
            media: mediaData.value,
        };
        // This should be an 'update' action in your store that calls the update API
        // For now, we call the API directly
        const { data, error } = await useFetch(`/api/prisma/products/update-product-by-id/${productToEdit.value?.id}`, {
            method: 'PUT',
            body: payload,
        });

        if (error.value) throw error.value;

        notify({ type: 'success', text: 'Product updated successfully!' });
        router.push('/seller/dashboard');

    } catch (err) {
        notify({ type: 'error', text: 'Failed to save product.' });
    } finally {
        isLoading.value = false;
    }
};
</script>