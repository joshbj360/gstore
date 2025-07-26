<template>
  <UploadLayout>
    <UploadError :errorType="errorType" />

    <!-- Loading States -->
    <LoadingOverlay :visible="isUploading" />
    <BulkUploadProgress v-if="bulkUploadState.active" :progress="bulkUploadState.progress" @cancel="cancelBulkUpload" />

    <div class="w-full mt-[80px] mb-[40px] bg-white shadow-lg rounded-md py-6 md:px-10 px-4">
      <!-- Header with Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-semibold">Add Products</h1>
            <p class="text-gray-500 text-sm">Upload single products or multiple products at once</p>
          </div>
          <div class="flex space-x-2">
            <button @click="activeTab = 'single'" class="px-4 py-2 text-sm font-medium rounded-md" :class="{
              'bg-[#F02C56] text-white': activeTab === 'single',
              'text-gray-700 hover:bg-gray-100': activeTab !== 'single'
            }">
              Single Upload
            </button>
            <button @click="activeTab = 'bulk'" class="px-4 py-2 text-sm font-medium rounded-md" :class="{
              'bg-[#F02C56] text-white': activeTab === 'bulk',
              'text-gray-700 hover:bg-gray-100': activeTab !== 'bulk'
            }">
              Bulk Upload
            </button>
          </div>
        </div>
      </div>

      <!-- Single Upload Tab -->
      <div v-if="activeTab === 'single'" class="mt-8 md:flex gap-6 ">
        <!-- Media Upload Section -->
        <div class="flex-2">
          <div class="bg-[#F8F8F8] p-6 rounded-lg">
            <div class="flex items-center mb-4">
              <Icon class="mr-4" size="20" name="mdi:cloud-upload" />
              <div class="flex-1">
                <h3 class="font-semibold text-[15px]">Upload Product Media</h3>
                <p class="text-semibold text-[13px] text-gray-400">
                  Drag and drop images/videos or click to browse
                </p>
                <UploadWidget :media-label="'product-media'" :allow-multiple="true" :max-files="10"
                  @upload-complete="handleMediaUpload" />
              </div>
            </div>


          </div>

          <!-- Media Preview -->
          <MediaPreview v-if="mediaData.length" :media="mediaData" @remove="removeMedia" @set-main="setMainDisplay" />
        </div>

        <!-- Product Form Section -->
        <div class="mt-4 mb-6 w-full">
          <ProductForm :media-data="mediaData" :key="formKey" @submit="handleProductSubmit" @discard="discardUpload" />
        </div>
      </div>

      <!-- Bulk Upload Tab -->
      <div v-if="activeTab === 'bulk'" class="mt-8">
        <BulkUploadGuide class="mb-6" />
        <BulkUploadWidget :media-label="'bulk-products'" :accept="'.csv'" :max-files="1"
          class="px-4 py-2  text-white rounded-md text-sm font-medium hover:bg-[#fab4b4]"
          @upload-complete="handleBulkUpload" @upload-error="() => { errorType = 'bulk-upload'; }">
          Upload CSV
        </BulkUploadWidget>

      </div>
    </div>
  </UploadLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { MediaType, type MediaInterface } from '~/models/interface/products/media.interface';
import type { ProductFileInterface, ProductInterface } from '~/models/interface/products/product.interface';
import { useProductStore } from '~/stores/product.store'

import LoadingOverlay from '~/components/upload/LoadingOverlay.vue';
import BulkUploadProgress from '~/components/upload/BulkUploadProgress.vue';
import BulkUploadGuide from '~/components/upload/BulkUploadGuide.vue';
import ProductForm from '~/components/upload/ProductForm.vue';
import UploadLayout from '~/layouts/UploadLayout.vue';
import MediaPreview from '~/components/shared/MediaPreview.vue';
import BulkUploadWidget from '~/components/upload/BulkUploadWidget.vue';
import UploadWidget from '~/components/shared/UploadWidget.vue';

const router = useRouter();

// State
const activeTab = ref<'single' | 'bulk'>('single');
const mediaData = ref<MediaInterface[]>([]);
const fileDisplay = ref<string | null>(null);
const errorType = ref<string | null>(null);
const isUploading = ref(false);
const formKey = ref(0); // Used to force re-render form
const bulkUploadState = ref({
  active: false,
  progress: 0,
  file: null as File | null
});

// Media Handling
const handleMediaUpload = (uploadedMedia: MediaInterface[]) => {
  mediaData.value = [...mediaData.value, ...uploadedMedia];
};
const productStore = useProductStore()

const removeMedia = (index: number) => {
  mediaData.value.splice(index, 1);
  if (mediaData.value.length > 0) {
    setMainDisplay(0);
  } else {
    fileDisplay.value = null;
  }
};

const setMainDisplay = (index: number) => {
  fileDisplay.value = mediaData.value[index]?.url || null;
};

// Product Submission
const handleProductSubmit = async (productData: ProductInterface) => {
  console.log('Handle submit product')
  isUploading.value = true;
  try {
    const completeProduct = {
      ...productData,
      media: mediaData.value,
    };

    const createdProduct = await productStore.createProduct(completeProduct);

    if (createdProduct) {
      // Optionally update local state or clear form
      router.push('/seller/dashboard?upload=success');
    } else {
      throw new Error('Product creation failed');
    }
  } catch (err) {
    errorType.value = 'upload';
    console.error('Upload error:', err);
    // Optionally set a more specific error message
  } finally {
    isUploading.value = false;
  }
};

// Bulk Upload Handling
const downloadTemplate = () => {
  // Implement CSV template download
  const link = document.createElement('a');
  link.href = '/templates/product-upload-template.csv';
  link.download = 'product-upload-template.csv';
  link.click();
};

const handleBulkUpload = async (files: ProductFileInterface[]) => {
  if (!files.length) return;

  bulkUploadState.value = {
    active: true,
    progress: 0,
    file: files[0].file // Assuming your MediaInterface has a file property
  };

  try {
    // Simulate progress - replace with actual upload progress
    const interval = setInterval(() => {
      bulkUploadState.value.progress += 10;
      if (bulkUploadState.value.progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          bulkUploadState.value.active = false;
          router.push('/seller/dashboard?bulk_upload=success');
        }, 500);
      }
    }, 300);
  } catch (err) {
    errorType.value = 'bulk-upload';
    bulkUploadState.value.active = false;
    console.error('Bulk upload error:', err);
  }
};

const cancelBulkUpload = () => {
  // Implement actual cancellation logic if needed
  bulkUploadState.value.active = false;
};

// Reset form
const discardUpload = () => {
  mediaData.value = [];
  fileDisplay.value = null;
  formKey.value += 1; // Force form reset
};
</script>