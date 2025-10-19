<template>
  <UploadLayout>
    <LoadingOverlay :visible="isSubmitting" />
    <BulkUploadProgress v-if="bulkUploadState.active" :progress="bulkUploadState.progress" @cancel="cancelBulkUpload" />

    <!-- Skeleton: Professional, Compact -->
    <div v-if="pending" class="p-6 max-w-4xl mx-auto space-y-6">
      <div class="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
          <div class="h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div class="space-y-4">
          <div class="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          <div class="h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Error: Actionable, Branded -->
    <div v-else-if="error" class="p-8 text-center max-w-md mx-auto">
      <Icon name="mdi:alert-circle" size="48" class="mx-auto mb-4 text-brand" />
      <p class="text-gray-600 text-lg mb-4">Couldn't load form data. Let's fix that.</p>
      <button @click="refresh" class="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors mr-3">Retry</button>
      <button @click="router.back()" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">Back</button>
    </div>

    <!-- Main Form: Responsive Grid, Stepper Flow -->
    <div v-else class="w-full mt-16 mb-12 bg-white shadow-xl rounded-2xl max-w-5xl mx-auto overflow-hidden">
      <!-- Header with Stepper -->
      <div class="p-2 md:p-2 border-b border-gray-200 bg-gray-50">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center space-x-3">
            <div class="stepper">
              <div class="step active">
                <span class="step-number">1</span>
                <span class="step-label">Media</span>
              </div>
              <div class="step-line"></div>
              <div class="step">
                <span class="step-number">2</span>
                <span class="step-label">Details</span>
              </div>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Add New Product</h1>
              <p class="text-gray-600 text-sm">Upload media, fill details, and go live in seconds.</p>
            </div>
          </div>
          <div class="flex space-x-2 shrink-0">
            <button @click="activeTab = 'single'" class="tab-btn" :class="{ 'active': activeTab === 'single' }">
              Single
            </button>
            <button @click="activeTab = 'bulk'" class="tab-btn" :class="{ 'active': activeTab === 'bulk' }">
              Bulk
            </button>
          </div>
        </div>
      </div>

      <!-- Single Upload: Guided Grid -->
      <div v-if="activeTab === 'single'" class="p-6 md:p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Step 1: Media -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-900 flex items-center">
              <span class="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-sm font-bold mr-2">1</span>
              Media Upload
            </h2>
            <div class="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand/50 transition-colors">
              <UploadWidget 
                :allow-multiple="true" 
                :alt-text="'product-media'" 
                @upload-complete="handleMediaUpload" 
                class="w-full"
              />
            </div>
            <MediaPreview 
              v-if="mediaData.length" 
              :media="mediaData" 
              @remove="removeMedia" 
              @set-main="setMainDisplay"
              class="space-y-2"
            />
          </div>
          <!-- Step 2: Details -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-900 flex items-center">
              <span class="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-2">2</span>
              Product Details
            </h2>
            <ProductForm 
              :media-data="mediaData" 
              :categories="categories"
              :seller-shipping-zones="shippingZones"
              :is-loading-category="categoryStore.isLoading"
              :key="formKey" 
              @submit="handleProductSubmit" 
              @discard="discardUpload" 
              @add-category="addNewCategory"
            />
          </div>
        </div>
      </div>

      <!-- Bulk Upload: Simplified Guide -->
      <div v-if="activeTab === 'bulk'" class="p-6 md:p-8">
        <BulkUploadGuide class="mb-8 bg-gray-50 p-6 rounded-xl" />
        <BulkUploadWidget 
          @upload-start="startBulkUpload" 
          @upload-complete="handleBulkUploadComplete" 
          @upload-error="handleBulkError"
        />
      </div>
    </div>
  </UploadLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore, useUserStore, useShippingStore, useCategoryStore } from '~/stores';
import { notify } from '@kyvg/vue3-notification';
import type { IMedia, IProduct, ICategory } from '~/models';

// Components
import UploadLayout from '~/layouts/UploadLayout.vue';
import ProductForm from '~/components/upload/ProductForm.vue';
import MediaPreview from '~/components/shared/MediaPreview.vue';
import UploadWidget from '~/components/upload/UploadWidget.vue';
import BulkUploadGuide from '~/components/upload/BulkUploadGuide.vue';
import BulkUploadWidget from '~/components/upload/BulkUploadWidget.vue';
import LoadingOverlay from '~/components/upload/LoadingOverlay.vue';
import BulkUploadProgress from '~/components/upload/BulkUploadProgress.vue';

const router = useRouter();
const userStore = useUserStore();
const productStore = useProductStore();
const shippingStore = useShippingStore();
const categoryStore = useCategoryStore();

const activeTab = ref<'single' | 'bulk'>('single');
const mediaData = ref<IMedia[]>([]);
const isSubmitting = ref(false);
const formKey = ref(0);
const bulkUploadState = ref({ active: false, progress: 0 });

// Async Data: Guarded for Auth
const { pending, error, refresh } = await useAsyncData('upload-form-data', async () => {
  if (!userStore.isLoggedIn || !userStore.isSeller) {
    if (import.meta.server) await router.push('/seller/become-a-seller');
    return null;
  }
  await Promise.all([
    categoryStore.fetchCategories(),
    shippingStore.fetchShippingZones()
  ]);
  return true;
}, {
  default: () => false,
});

const categories = computed(() => categoryStore.categories);
const shippingZones = computed(() => shippingStore.shippingZones);

// Handlers
const handleMediaUpload = (uploadedMedia: IMedia[]) => {
  mediaData.value = uploadedMedia;
  notify({ type: 'success', text: `${uploadedMedia.length} media uploaded!` });
};

const removeMedia = (index: number) => {
  mediaData.value.splice(index, 1);
  notify({ type: 'info', text: 'Media removed.' });
};

const setMainDisplay = (index: number) => {
  if (index < 0 || index >= mediaData.value.length) return;
  const mainMedia = mediaData.value.splice(index, 1)[0];
  mediaData.value.unshift(mainMedia);
  notify({ type: 'info', text: 'Set as main media.' });
};

const handleProductSubmit = async (productData: Partial<IProduct>) => {
  if (mediaData.value.length === 0) {
    notify({ type: 'error', text: 'Add at least one image/video first.' });
    return;
  }
  isSubmitting.value = true;
  try {
    const createdProduct = await productStore.createProduct({ 
      ...productData, 
      media: mediaData.value,
      sellerId: userStore.sellerProfile?.id 
    } as IProduct);
    notify({ type: 'success', text: `Product "${createdProduct?.title}" live! Auto-shared to social.` });
    router.push('/seller/dashboard');
  } catch (err) {
    notify({ type: 'error', text: 'Upload failed—check details and retry.' });
  } finally {
    isSubmitting.value = false;
  }
};

const addNewCategory = async (categoryData: { name: string; thumbnailCatUrl: string }) => {
  try {
    const newCategory = await categoryStore.addCategory(categoryData);
    notify({ type: 'success', text: `Category "${newCategory?.name}" added!` });
  } catch (err) {
    notify({ type: 'error', text: 'Category creation failed.' });
  }
};

const discardUpload = () => {
  if (confirm('Discard changes?')) {
    mediaData.value = [];
    formKey.value += 1;
    notify({ type: 'info', text: 'Changes discarded.' });
  }
};

// Bulk Upload
const startBulkUpload = () => {
  isSubmitting.value = true;
  bulkUploadState.value = { active: true, progress: 0 };
};

const handleBulkUploadComplete = async (files: File[]) => {
  if (!files.length) return;
  try {
    const results = await productStore.createBatchProducts(files); // Your batch API
    notify({ type: 'success', text: `${results.success} products uploaded! ${results.errors.length} skipped.` });
    router.push('/seller/dashboard?bulk_success=true');
  } catch (err) {
    notify({ type: 'error', text: 'Bulk upload failed—try fewer files.' });
  } finally {
    bulkUploadState.value.active = false;
    isSubmitting.value = false;
  }
};

const handleBulkError = (error: string) => {
  notify({ type: 'error', text: error || 'Bulk upload error.' });
  bulkUploadState.value.active = false;
  isSubmitting.value = false;
};

const cancelBulkUpload = () => {
  bulkUploadState.value = { active: false, progress: 0 };
  isSubmitting.value = false;
  notify({ type: 'info', text: 'Upload cancelled.' });
};
</script>

<style scoped>
.stepper { @apply flex items-center space-x-4; }
.step { @apply relative flex items-center; }
.step-number { @apply w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold; }
.step.active .step-number { @apply bg-brand text-white; }
.step-line { @apply w-8 h-0.5 bg-gray-200; }
.step.active + .step .step-number { @apply bg-gray-200; }
.step-label { @apply text-sm text-gray-600 ml-2; }
.tab-btn { @apply px-4 py-2 text-sm font-medium rounded-md transition-colors border; }
.tab-btn.active { @apply bg-brand text-white border-brand shadow-sm; }
</style>