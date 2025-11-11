<template>
    <UploadLayout>
        <LoadingOverlay :visible="isSubmitting" />
        <BulkUploadProgress v-if="bulkUploadState.active" :progress="bulkUploadState.progress" @cancel="cancelBulkUpload" />

        <UploadPageSkeleton v-if="pending || isLoadingProduct" />
        
        <div v-else-if="error || productError" class="p-8 text-center max-w-md mx-auto">
             <Icon name="mdi:alert-circle" size="48" class="mx-auto mb-4 text-brand" />
             <p class="text-gray-600 dark:text-neutral-400 text-lg mb-4">
               {{ error ? "Couldn't load form data." : "Couldn't load product to edit." }}
             </p>
             <button @click="error ? refresh() : fetchProductToEdit()" class="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-light transition-colors mr-3">Retry</button>
             <button @click="router.back()" class="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-neutral-700">Back</button>
        </div>

        <div v-else class="w-full  mb-12 bg-white dark:bg-neutral-950 shadow-xl rounded-2xl max-w-5xl mx-auto overflow-hidden">
            <div class="p-6 md:p-8 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div class="flex items-center space-x-3">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                              {{ isEditMode ? 'Edit Product' : 'Add New Product' }}
                            </h1>
                            <p class="text-gray-600 dark:text-neutral-400 text-sm">
                              {{ isEditMode ? 'Update your product details and media.' : 'Upload media, fill details, and go live.' }}
                            </p>
                        </div>
                    </div>
                     <div class="flex space-x-2 shrink-0">
                        <button @click="activeTab = 'single'" class="tab-btn" :class="{ 'active': activeTab === 'single' }">Single</button>
                        <button @click="activeTab = 'bulk'" class="tab-btn" :class="{ 'active': activeTab === 'bulk' }">Bulk</button>
                     </div>
                </div>
            </div>

            <div v-if="activeTab === 'single'" class="p-6 md:p-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div class="space-y-4">
                        <h2 class="section-header"><span class="step-circle">1</span> Media Upload</h2>
                         <div class="bg-gray-50 dark:bg-neutral-900 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700 hover:border-[#f02c56]/50 transition-colors">
                            <UploadWidget 
                                :allow-multiple="true" 
                                 :alt-text="'product'"
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
                    <div class="space-y-4">
                         <h2 class="section-header"><span class="step-circle">2</span> Product Details</h2>
                          <ProductForm 
                            :media-data="mediaData" 
                            :categories="categories"
                            :seller-shipping-zones="shippingZones"
                            :is-loading-category="categoryStore.isLoading"
                            :key="formKey"
                            :existing-product="productToEdit"
                            @submit="handleProductSubmit" 
                            @discard="discardUpload" 
                            @add-category="addNewCategory"
                         />
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'bulk'" class="p-6 md:p-8">
                 <BulkUploadGuide class="mb-8 bg-gray-50 dark:bg-neutral-900 p-6 rounded-xl border dark:border-neutral-800" />
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
const route = useRoute();
const userStore = useUserStore();
const productStore = useProductStore();
const shippingStore = useShippingStore();
const categoryStore = useCategoryStore();

const activeTab = ref<'single' | 'bulk'>('single');
const mediaData = ref<IMedia[]>([]);
const isSubmitting = ref(false);
const formKey = ref(0);
const bulkUploadState = ref({ active: false, progress: 0 });

const isEditMode = computed(() => !!route.query.edit);
const productToEdit = ref<IProduct | null>(null);
const isLoadingProduct = ref(false);
const productError = ref<Error | null>(null);

// This function fetches the product data if we are in edit mode
const fetchProductToEdit = async () => {
  if (isEditMode.value) {
    const slug = route.query.edit as string;
    isLoadingProduct.value = true;
    productError.value = null;
    try {
      const product = await productStore.getProductBySlug(slug);
      if (product) {
        productToEdit.value = product;
        mediaData.value = product.media || []; // Pre-fill media
      } else {
        throw new Error('Product not found.');
      }
    } catch (err: any) {
      productError.value = err;
    } finally {
      isLoadingProduct.value = false;
    }
  }
};

// Fetch data for the form (categories, shipping zones)
const { pending, error, refresh } = await useLazyAsyncData('upload-form-data', async () => {
  if (!userStore.isLoggedIn || !userStore.isSeller) {
    if (import.meta.server) await navigateTo('/auth/login'); // Changed from /seller/become-a-seller
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

// Run this when the component mounts
onMounted(() => {
  fetchProductToEdit();
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

/**
 * THE FIX: This function is now simple and clean.
 * It calls one action in the store and trusts it to do the work.
 */
const handleProductSubmit = async (productData: IProduct) => {
  if (mediaData.value.length === 0) {
    notify({ type: 'error', text: 'Add at least one image/video first.' });
    return;
  }
  
  isSubmitting.value = true;
  productData.media = mediaData.value;

  try {
    let savedProduct: IProduct | null = null;
    if (isEditMode.value && productToEdit.value) {
      // --- UPDATE LOGIC (NOW ENABLED) ---
      savedProduct = await productStore.updateProduct(productToEdit.value.id, productData);
      if (savedProduct) {
        notify({ type: 'success', text: `Product "${savedProduct.title}" updated!` });
      } else {
        throw new Error('Failed to update product.');
      }
    } else {
      // --- CREATE LOGIC ---
      savedProduct = await productStore.createProduct(productData);
      if (savedProduct) {
        notify({ type: 'success', text: `Product "${savedProduct.title}" created!` });
      } else {
        throw new Error('Failed to create product.');
      }
    }
    router.push('/seller/dashboard');
  } catch (err: any) {
     notify({ type: 'error', text: err.data?.message || 'Upload failed—check details and retry.' });
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