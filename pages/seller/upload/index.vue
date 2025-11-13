<template>
  <UploadLayout>
    <LoadingOverlay :visible="isSubmitting" />

    <div class="w-full mt-12 mb-12 bg-white dark:bg-neutral-950 shadow-xl rounded-2xl max-w-5xl mx-auto overflow-hidden">
      
      <!-- Stepper/Tab Header -->
      <div class="p-6 md:p-8 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-1">
                {{ activeTab === 'single' ? 'Add New Product' : 'Bulk Product Upload' }}
              </h1>
              <p class="text-gray-600 dark:text-neutral-400 text-sm">
                {{ activeTab === 'single' ? 'Use the 3-step wizard to go live.' : 'Upload a CSV for many products at once.' }}
              </p>
            </div>
            <div class="flex space-x-2 shrink-0">
                <button @click="activeTab = 'single'" class="tab-btn" :class="{ 'active': activeTab === 'single' }">Single</button>
                <button @click="activeTab = 'bulk'" class="tab-btn" :class="{ 'active': activeTab === 'bulk' }">Bulk</button>
            </div>
        </div>

        <div v-if="activeTab === 'single'" class="mt-6">
          <div class="flex space-x-2">
            <div v-for="i in 3" :key="i" class="flex-1 h-2 rounded-full" :class="getStepClass(i)"></div>
          </div>
        </div>
      </div>

      <!-- 
        ================================
        TAB 1: SINGLE PRODUCT WIZARD
        ================================
      -->
      <div v-if="activeTab === 'single'">
        <div class="p-6 md:p-8 space-y-6">
          <!-- Step 1: Media Upload -->
          <div v-if="step === 1" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Upload Media</h3>
              <p class="text-sm text-gray-500 dark:text-neutral-400 mb-4">Add photos and videos. The first item will be the main cover.</p>
            </div>
            <UploadWidget 
                :allow-multiple="true" 
                :alt-text="'product'"
                @upload-complete="handleMediaUpload" 
            />
            <MediaPreview v-if="product.media.length" :media="product.media" @remove="removeMedia" @set-main="setMainMedia" class="mt-6" />
          </div>

          <!-- Step 2: Details & AI -->
          <div v-if="step === 2" class="space-y-6">
            <!-- Basic Info -->
            <TextInput v-model:input="product.title" label="Product Title" placeholder="e.g., Silk Abaya" required />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectInput v-model:input="product.category" :categories="categories" label="Category" @open-dialog="showCategoryDialog = true" required />
              <CurrencyInput v-model:input="product.price" label="Price" currency="NGN" required />
            </div>
            
            <!-- Description & AI -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-neutral-300">Description</label>
                <button 
                    type="button" @click="generateDescription" :disabled="isGenerating.desc || !product.title"
                    class="text-xs font-semibold text-brand hover:text-brand-dark flex items-center gap-1 disabled:opacity-50"
                >
                    <Icon v-if="isGenerating.desc" name="eos-icons:loading" />
                    <Icon v-else name="mdi:creation" />
                    {{ isGenerating.desc ? 'Generating...' : 'Generate with AI' }}
                </button>
              </div>
              <!-- THE FIX: Use v-model:modelValue for RichTextEditor -->
              <RichTextEditor v-model:modelValue="product.description" />
            </div>

            <!-- Variants & Stock -->
            <div class="p-4 border rounded-md bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                <h4 class="text-sm font-medium text-gray-700 dark:text-neutral-200 mb-3">Sizes & Stock</h4>
                <div v-for="(variant, index) in product.variants" :key="index" class="flex items-center gap-2 mb-2">
                    <TextInput v-model:input="variant.size" placeholder="Size (e.g., Medium)" class="flex-1" />
                    <NumberInput v-model:input="variant.stock" placeholder="Stock" class="w-28" />
                    <CurrencyInput v-model:input="variant.price" label="Price" :showNairaValue="false" placeholder="Override" class="w-36" />
                    <button @click="removeVariant(index)" type="button" class="p-2 text-gray-400 dark:text-neutral-500 hover:text-brand-dark dark:hover:text-brand-light rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700">
                        <Icon name="mdi:trash-can-outline" size="20" />
                    </button>
                </div>
                <button @click="addVariant" type="button" class="text-sm text-brand hover:underline mt-2 font-semibold">+ Add another size</button>
            </div>

            <!-- Shipping Profile -->
            <div>
                <h3 class="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Shipping Profile</h3>
                <div v-if="!shippingZones || shippingZones.length === 0" class="text-center p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
                    <p class="text-sm text-gray-600 dark:text-neutral-400">You haven't created any shipping profiles yet.</p>
                    <NuxtLink to="/sellers/dashboard" class="text-sm font-semibold text-brand hover:underline mt-2 inline-block">Manage Shipping</NuxtLink>
                </div>
                <select v-else v-model="product.shippingZoneId" class="form-input" required>
                    <option disabled :value="null">-- Select a Shipping Profile --</option>
                    <option v-for="zone in shippingZones" :key="zone.id" :value="zone.id">{{ zone.name }}</option>
                </select>
            </div>
            
            <!-- Tags & AI -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-neutral-300">Tags & Keywords</label>
                <button 
                    type="button" @click="generateTags" :disabled="isGenerating.tags || !product.title"
                    class="text-xs font-semibold text-brand hover:text-brand-dark flex items-center gap-1 disabled:opacity-50"
                >
                    <Icon v-if="isGenerating.tags" name="eos-icons:loading" />
                    <Icon v-else name="mdi:pound" />
                    {{ isGenerating.tags ? 'Suggesting...' : 'Suggest Tags' }}
                </button>
              </div>
              <TagInput v-model="product.tags" placeholder="Add a tag and press Enter..." />
            </div>
          </div>
          
          <!-- 
            ================================
            STEP 3: SOCIAL SYNC (THE FIX)
            ================================
          -->
          <div v-if="step === 3" class="space-y-6">
           <SocialSync 
              :product-info="product"
              @update:captions="handleCaptionsUpdate"
            />
          </div>
        </div>
        
        <!-- Footer Navigation (Only for Single Upload) -->
        <div v-if="activeTab === 'single'" class="sticky bottom-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm border-t border-gray-200 dark:border-neutral-800 p-4 flex justify-between items-center">
          <button @click="prevStep" :disabled="step === 1" class="px-6 py-2.5 border border-gray-300 dark:border-neutral-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50">
            Back
          </button>
          <button v-if="step < 3" @click="nextStep" :disabled="!canProceed" class="px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-light disabled:opacity-50">
            Next
          </button>
          <button v-if="step === 3" @click="publishProduct" :disabled="isSubmitting" class="px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-light disabled:opacity-50">
            <Icon v-if="isSubmitting" name="eos-icons:loading" class="mr-2" />
            {{ isSubmitting ? 'Publishing...' : 'Publish Product' }}
          </button>
        </div>
      </div>

      <!-- 
        ================================
        TAB 2: BULK UPLOAD (Unchanged)
        ================================
      -->
      <div v-if="activeTab === 'bulk'" class="p-6 md:p-8 space-y-6">
        <BulkUploadGuide class="bg-gray-50 dark:bg-neutral-800 p-6 rounded-xl border dark:border-neutral-700" />
        <BulkUploadWidget 
            @upload-start="startBulkUpload" 
            @upload-complete="handleBulkUploadComplete" 
            @upload-error="handleBulkError"
        />
        <BulkUploadProgress v-if="bulkUploadState.active" :progress="bulkUploadState.progress" @cancel="cancelBulkUpload" />
      </div>

    </div>
    
    <CategoryDialog :is-open="showCategoryDialog" :is-loading="false" @submit="(data) => handleAddCategory(data)" @close="showCategoryDialog = false" />
  </UploadLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore, useCategoryStore, useShippingStore, useUserStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { notify } from '@kyvg/vue3-notification';
import type { IMedia, IProduct, ICategory, IShippingZone, IProductVariant, EProductStatus } from '~/models';

// Import all your shared components
import UploadLayout from '~/layouts/UploadLayout.vue';
import TextInput from '~/components/shared/TextInput.vue';
import SelectInput from '~/components/category/SelectInput.vue';
import CurrencyInput from '~/components/shared/CurrencyInput.vue';
import RichTextEditor from '~/components/shared/RichTextEditor.vue';
import TagInput from '~/components/shared/TagInput.vue';
import MediaPreview from '~/components/shared/MediaPreview.vue';
import CategoryDialog from '~/components/category/CategoryDialog.vue';
import LoadingOverlay from '~/components/upload/LoadingOverlay.vue';
import BulkUploadGuide from '~/components/upload/BulkUploadGuide.vue';
import BulkUploadWidget from '~/components/upload/BulkUploadWidget.vue';
import BulkUploadProgress from '~/components/upload/BulkUploadProgress.vue';
import UploadWidget from '~/components/upload/UploadWidget.vue';
import NumberInput from '~/components/shared/NumberInput.vue'; 
import SocialSync from '~/components/upload/SocialSync.vue';
import { de } from 'zod/v4/locales';


const router = useRouter();
const productStore = useProductStore();
const categoryStore = useCategoryStore();
const shippingStore = useShippingStore(); 
const userStore = useUserStore();
const apiService = useApiService();

// --- STATE ---
const activeTab = ref<'single' | 'bulk'>('single');
const step = ref(1);
const stepHeaders = [
  "", // Index 0 is unused
  "Step 1: Upload Your Media",
  "Step 2: Add Product Details",
  "Step 3: Sync to Social Media"
];

const product = reactive({
  title: '',
  category: '',
  price: null as number | null,
  description: '',
  tags: [] as string[],
  media: [] as IMedia[],
  variants: [{ size: 'One Size', stock: 1, price: null as number | null }] as Partial<IProductVariant>[],
  shippingZoneId: null as string | null,
  isAccessory: false,
  discount: null as number | null,
});

const isSubmitting = ref(false);
const isGenerating = reactive<Record<string, boolean>>({
  desc: false,
  tags: false,
});
const showCategoryDialog = ref(false);
const bulkUploadState = ref({ active: false, progress: 0 });
const generatedCaptions = ref<Record<string, string>>({});

// --- DATA FETCHING ---
const { data: categories } = useLazyAsyncData('categories', () => categoryStore.fetchCategories());
const { data: shippingZones } = useLazyAsyncData('shipping-zones', () => shippingStore.fetchShippingZones());

// --- WIZARD LOGIC ---
const canProceed = computed(() => {
  if (step.value === 1) return product.media.length > 0;
  if (step.value === 2) {
    return product.title && product.category && product.price && product.shippingZoneId;
  }
  return true;
});
const nextStep = () => { if (canProceed.value && step.value < 3) step.value++; };
const prevStep = () => { if (step.value > 1) step.value--; };
const getStepClass = (index: number) => {
  if (index < step.value) return 'bg-brand';
  if (index === step.value) return 'bg-brand/50';
  return 'bg-gray-200 dark:bg-neutral-700';
};

// --- STEP 1: MEDIA ---
const handleMediaUpload = (uploadedMedia: IMedia | IMedia[]) => {
    if (Array.isArray(uploadedMedia)) {
        product.media = uploadedMedia;
    } else {
        product.media = [uploadedMedia];
    }
    notify({ type: 'success', text: `${product.media.length} media uploaded!` });
};
const removeMedia = (index: number) => { product.media.splice(index, 1); };
const setMainMedia = (publicId: string) => {
    const index = product.media.findIndex(m => m.public_id === publicId);
    if (index > 0) {
        const main = product.media.splice(index, 1)[0];
        product.media.unshift(main);
    }
};

// --- STEP 2: DETAILS & AI ---
const handleAddCategory = async (data: { name: string, thumbnailCatUrl: string }) => {
    const newCat = await categoryStore.addCategory(data);
    if (newCat) {
        product.category = newCat.name;
        showCategoryDialog.value = false;
    }
};
const generateDescription = async () => {
    isGenerating.desc = true;
    try {
        const res = await apiService.aiGenerateDescription({
            title: product.title,
            category: product.category,
            price: product.price,
            description: product.description
        });
        product.description = res.description;
    } catch (e: any) {
        notify({ type: 'error', text: e.message || 'AI failed.' });
    } finally {
        isGenerating.desc = false;
    }
};
const generateTags = async () => {
    isGenerating.tags = true;
    try {
        const res = await apiService.aiSuggestHashtags(product.title, product.category);
        const newTags = res.hashtags.filter((t: string) => !product.tags.includes(t));
        product.tags.push(...newTags);
    } catch (e: any) {
        notify({ type: 'error', text: e.message || 'AI failed.' });
    } finally {
        isGenerating.tags = false;
    }
};
const addVariant = () => product.variants.push({ size: '', stock: 0, price: null });
const removeVariant = (index: number) => { if (product.variants.length > 1) product.variants.splice(index, 1); };

const publishProduct = async () => {
  isSubmitting.value = true;
  try {
    // --- THE FIX ---
    // We construct the full IProduct object that the store expects.
    const completeProduct: IProduct = {
        // Form data
        title: product.title,
        price: product.price!, // ! asserts it's not null (canProceed checks this)
        description: product.description,
        isAccessory: product.isAccessory,
        shippingZoneId: product.shippingZoneId!, // ! asserts it's not null
        discount: product.discount || 0,
        media: product.media,
        
        // Formatted data
        tags: product.tags.map(t => ({ name: t })),
        category: [{ category: { name: product.category } }],
        variants: product.variants.filter(v => v.size && v.size.trim() && v.stock! >= 0) as IProductVariant[],
        
        // Default/Placeholder data to satisfy the IProduct type
        id: 0, // Will be overridden by DB
        slug: '', // Will be generated by server
        sellerId: userStore.sellerProfile?.id || '', // Will be set by server
        store_slug: userStore.sellerProfile?.store_slug || '', // Will be set by server
        status: 'DRAFT' as EProductStatus, // The store action sets this
        created_at: new Date(),
        updated_at: new Date(),
        soldCount: 0,
        // Add any other missing required fields from IProduct with default values
        measurement: null,
        likes: [],
        notifications: [],
        comments: [],
        shares: [],
        socialMedia: [],
        taggedInPosts: [],
        styledWith: [],
        appearsIn: [],
    };
    // -----------------

    const newProduct = await productStore.createProduct(completeProduct);
    
    if (!newProduct) throw new Error("Product creation failed.");

    notify({ type: 'success', text: 'Product created successfully!' });

    // 2. Post to selected social platforms
    for (const [platformId, caption] of Object.entries(generatedCaptions.value)) {
      if (caption) {
        await apiService.postToSocial({
          platform: platformId,
          caption: caption,
          mediaUrl: newProduct.media![0].url,
          productUrl: `${useRuntimeConfig().public.baseURL}/product/${newProduct.slug}`
        });
        notify({ type: 'info', text: `Posted to ${platformId}!` });
      }
    }
    
    router.push(`/product/${newProduct.slug}`);

  } catch (e: any) {
    notify({ type: 'error', text: e.message || 'Publication failed.' });
  } finally {
    isSubmitting.value = false;
  }
};

const handleCaptionsUpdate = (captions: Record<string, string>) => {
  generatedCaptions.value = captions;
};

// --- BULK UPLOAD HANDLERS ---
const startBulkUpload = () => { isSubmitting.value = true; bulkUploadState.value = { active: true, progress: 0 }; };
const handleBulkUploadComplete = async (files: File[]) => { /* ... */ };
const handleBulkError = (error: string) => { /* ... */ };
const cancelBulkUpload = () => { /* ... */ };

</script>

<style scoped>
.form-input { 
  @apply mt-1 block w-full border border-gray-300 dark:border-neutral-700 rounded-lg shadow-sm py-2 px-3 
         bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100
         focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent; 
}
.tab-btn { 
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors border border-gray-300 dark:border-neutral-700
         bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300; 
}
.tab-btn.active { 
  @apply bg-brand text-white border-brand shadow-sm; 
}
.social-connect-btn {
  @apply flex-1 p-3 rounded-lg bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50;
}
</style>