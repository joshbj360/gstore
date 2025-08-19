<template>
  <UploadLayout>
    <LoadingOverlay :visible="isUploading" />
    <BulkUploadProgress v-if="bulkUploadState.active" :progress="bulkUploadState.progress" @cancel="cancelBulkUpload" />

    <div class="w-full mt-16 mb-12 bg-white shadow-xl rounded-2xl">
      <div class="p-6 md:p-8 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Add Products</h1>
            <p class="text-gray-500 text-sm mt-1">Upload a single product with a detailed form or multiple products at once via CSV.</p>
          </div>
          <div class="flex space-x-2 mt-4 sm:mt-0 shrink-0">
            <button @click="activeTab = 'single'" class="px-4 py-2 text-sm font-medium rounded-md transition-colors" :class="{
              'bg-[#F02C56] text-white shadow-md': activeTab === 'single',
              'text-gray-700 bg-gray-100 hover:bg-gray-200': activeTab !== 'single'
            }">
              Single Upload
            </button>
            <button @click="activeTab = 'bulk'" class="px-4 py-2 text-sm font-medium rounded-md transition-colors" :class="{
              'bg-[#F02C56] text-white shadow-md': activeTab === 'bulk',
              'text-gray-700 bg-gray-100 hover:bg-gray-200': activeTab !== 'bulk'
            }">
              Bulk Upload
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'single'" class="p-6 md:p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="space-y-6">
            <h2 class="text-lg font-semibold text-gray-800">
              <span class="text-xs font-bold py-1 px-2 rounded-full bg-[#f02c56]/10 text-[#f02c56] mr-2">1</span>
              Upload Media
            </h2>
            <div class="bg-gray-50 p-6 rounded-lg border border-dashed">
              <UploadWidget 
                v-if="userStore.user?.id"
                :allow-multiple="true" 
                :max-files="10"
                :seller-id="userStore.user?.id"
                @upload-complete="handleMediaUpload" 
              />
            </div>
            <MediaPreview v-if="mediaData.length" :media="mediaData" @remove="removeMedia" @set-main="setMainDisplay" />
          </div>

          <div class="space-y-6">
             <h2 class="text-lg font-semibold text-gray-800">
              <span class="text-xs font-bold py-1 px-2 rounded-full bg-[#f02c56]/10 text-[#f02c56] mr-2">2</span>
              Add Details
            </h2>
            <ProductForm 
                :media-data="mediaData" 
                :key="formKey" 
                @submit="handleProductSubmit" 
                @discard="discardUpload" 
            />
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'bulk'" class="p-6 md:p-8">
        <BulkUploadGuide class="mb-6" />
        <BulkUploadWidget 
          @upload-complete="handleBulkUpload" 
          @upload-error="() => notify({ type: 'error', text: 'Bulk upload failed. Please check the file format.' })"
        />
      </div>
    </div>
  </UploadLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore, useUserStore } from '~/stores';
import { notify } from "@kyvg/vue3-notification";
import type { MediaInterface } from '~/models/interface/products/media.interface';
import type { ProductFileInterface, ProductInterface } from '~/models/interface/products/product.interface';

// Component Imports
import UploadLayout from '~/layouts/UploadLayout.vue';
import LoadingOverlay from '~/components/upload/LoadingOverlay.vue';
import BulkUploadProgress from '~/components/upload/BulkUploadProgress.vue';
import BulkUploadGuide from '~/components/upload/BulkUploadGuide.vue';
import ProductForm from '~/components/upload/ProductForm.vue';
import MediaPreview from '~/components/shared/MediaPreview.vue';
import BulkUploadWidget from '~/components/upload/BulkUploadWidget.vue';
import UploadWidget from '@/components/upload/UploadWidget.vue';

const router = useRouter();
const userStore = useUserStore();
const productStore = useProductStore();

// --- Authentication Guard ---
onMounted(() => {
  if (!userStore.isLoggedIn || !userStore.isSeller) {
    notify({ type: 'warn', text: 'You must be a seller to upload products.' });
    router.push('/');
  }
});

// State
const activeTab = ref<'single' | 'bulk'>('single');
const mediaData = ref<MediaInterface[]>([]);
const isUploading = ref(false);
const formKey = ref(0);
const bulkUploadState = ref({
  active: false,
  progress: 0,
});

// Media Handling for Single Upload
const handleMediaUpload = (uploadedMedia: MediaInterface[]) => {
  mediaData.value.push(...uploadedMedia);
};

const removeMedia = (index: number) => {
  mediaData.value.splice(index, 1);
};

const setMainDisplay = (index: number) => {
  if (index < 0 || index >= mediaData.value.length) return;
  const mainMedia = mediaData.value.splice(index, 1)[0];
  mediaData.value.unshift(mainMedia);
  notify({ type: 'success', text: 'Main image updated.' });
};

// Product Submission for Single Upload
const handleProductSubmit = async (productData: ProductInterface) => {
  if (mediaData.value.length === 0) {
      notify({ type: 'error', text: 'Please upload at least one image or video.' });
      return;
  }
  isUploading.value = true;
  try {
    const completeProduct = { ...productData, media: mediaData.value };
    const createdProduct = await productStore.createProduct(completeProduct);
    if (createdProduct) {
      notify({ type: 'success', text: 'Product created successfully!' });
      router.push('/seller/dashboard?upload=success');
    } else {
      throw new Error('Product creation failed on the server.');
    }
  } catch (err: any) {
    notify({ type: 'error', text: err.message || 'Failed to create product.' });
  } finally {
    isUploading.value = false;
  }
};

// Bulk Upload Handling
const handleBulkUpload = (files: ProductFileInterface[]) => {
  if (!files.length) return;
  bulkUploadState.value = { active: true, progress: 0 };
  
  // This should be replaced with your actual API call and progress tracking
  const interval = setInterval(() => {
    bulkUploadState.value.progress += 10;
    if (bulkUploadState.value.progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        bulkUploadState.value.active = false;
        notify({ type: 'success', text: 'Bulk upload complete!' });
        router.push('/seller/dashboard?bulk_upload=success');
      }, 500);
    }
  }, 300);
};

const cancelBulkUpload = () => {
  bulkUploadState.value.active = false;
  // Add logic to cancel the actual upload if possible
};

// Reset Form for Single Upload
const discardUpload = () => {
  mediaData.value = [];
  formKey.value += 1; // Force form reset by changing its key
  notify({ type: 'info', text: 'Changes discarded.' });
};
</script>