<template>
  <!-- The main form container with a relative class for the sticky footer -->
  <div class="relative">
    <form @submit.prevent="submitForm" class="space-y-8 pb-24">
      
      <!-- Section 1: Basic Information -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            v-model:input="product.title"
            placeholder="e.g., Silk Abaya with Embroidery"
            label="Product Name"
            :error="errors.title"
            required
          />
          <SelectInput
            v-model:input="selectedCategory.name"
            :categories="categories"
            label="Category"
            :error="errors.category"
            @open-dialog="showCategoryDialog = true"
            required
          />
        </div>
      </div>

      <!-- Section 2: Description -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Description</h3>
        <RichTextEditor
          :model-value="product.description"
          @update:model-value="updateDescription"
          :error="errors.description"
        />
      </div>

      <!-- Section 3: Pricing & Inventory -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Pricing & Inventory</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyInput
                v-model:input="product.price"
                label="Price"
                :error="errors.price"
                required
            />
            <CurrencyInput
                v-model:input="product.discount"
                label="Discount Price (Optional)"
                :error="errors.discount"
            />
        </div>
        <div class="mt-6 p-4 border rounded-md bg-gray-50">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Sizes & Stock</h4>
            <div v-for="(variant, index) in variants" :key="index" class="flex items-center gap-2 mb-2">
                <TextInput v-model:input="variant.size" placeholder="Size (e.g., Medium, 42)" class="flex-1" />
                <NumberInput v-model:input="variant.stock" placeholder="Stock" class="w-28" />
                <button @click="removeVariant(index)" type="button" class="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200 transition-colors">
                    <Icon name="mdi:trash-can-outline" size="20" />
                </button>
            </div>
            <button @click="addVariant" type="button" class="text-sm text-[#f02c56] hover:underline mt-2 font-semibold">
                + Add another size
            </button>
        </div>
      </div>

      <!--
        SECTION 4: SHIPPING PROFILE SELECTION (NOW INCLUDED)
      -->
      <div v-if="sellerShippingZones.length>0" class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Shipping Profile</h3>
        <p class="text-sm text-gray-500 mb-3">Choose which shipping rules to apply to this product. You can manage your profiles in the dashboard.</p>
        <select v-model="selectedShippingZoneId" class="form-input" required>
            <option disabled :value="null">-- Select a Shipping Profile --</option>
            <option v-for="zone in sellerShippingZones" :key="zone.id" :value="zone.id">
                {{ zone.name }}
            </option>
        </select>
        <p v-if="errors.shippingZone" class="form-error">{{ errors.shippingZone }}</p>
         <NuxtLink to="/seller/dashboard/shipping" class="text-sm text-[#f02c56] hover:underline mt-2 inline-block">
            Manage Shipping Profiles
        </NuxtLink>
      </div>

      <!-- Section 5: Tags -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Tags & Keywords</h3>
        <TagInput
            v-model:modelValue="tags"
            label="Product Tags"
            placeholder="Add a tag and press Enter..."
        />
      </div>
    </form>
    
    <!-- Sticky Footer for Form Actions -->
    <div class="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t p-4 flex justify-end space-x-3">
        <button @click="$emit('discard')" type="button" class="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Discard
        </button>
        <button @click="submitForm" type="button" class="px-6 py-2.5 bg-[#F02C56] text-white rounded-lg text-sm font-semibold hover:bg-[#df4949] transition-colors">
            Save Product
        </button>
    </div>

    <CategoryDialog
      v-if="showCategoryDialog"
      @submit="addNewCategory"
      @close="showCategoryDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useCategoryStore, useUserStore, useShippingStore} from '~/stores';
import { defaultProduct, type ProductInterface } from '~/models/interface/products/product.interface';
import { defaultMeasurement, type MeasurementInterface } from '~/models/interface/products/measurement.interface';
import type { MediaInterface } from '~/models/interface/products/media.interface';
import { defaultCategory, type CategoryInterface } from '~/models/interface/products/category.interface';
import { notify } from "@kyvg/vue3-notification";

// Component Imports
import TextInput from '../shared/TextInput.vue';
import SelectInput from '../category/SelectInput.vue';
import TagInput from '../shared/TagInput.vue';
import RichTextEditor from '../shared/RichTextEditor.vue';
import CurrencyInput from '../shared/CurrencyInput.vue';
import NumberInput from '../shared/NumberInput.vue';
import CategoryDialog from '../category/CategoryDialog.vue';
import type { ShippingAddressInterface } from '~/models/interface/shipping/address.interface';
import type { ShippingZoneInterface } from '~/models/interface/shipping/shipping.interface';

const emit = defineEmits(['submit', 'discard']);

const props = defineProps({
  mediaData: {
    type: Array as () => MediaInterface[],
    default: () => []
  },
  existingProduct: {
    type: Object as () => ProductInterface | null,
    default: null
  }
});

const categoryStore = useCategoryStore();
const userStore = useUserStore();
const shippingStore = useShippingStore()
const categories = ref<CategoryInterface[]>([]);

// Form Data
const product = ref<Partial<ProductInterface>>({ ...defaultProduct });
const measurement = ref<MeasurementInterface>({ ...defaultMeasurement });
const tags = ref<string[]>([]);
const selectedCategory = ref<CategoryInterface>({ ...defaultCategory });
const showCategoryDialog = ref(false);
const variants = ref([{ size: '', stock: 1 }]);
const errors = ref<Record<string, string>>({});

// --- COMPUTED SHIPPING PROPERTY THAT GETS DATA FROM THE STORE ---
const sellerShippingZones = computed((): ShippingZoneInterface[] => shippingStore.shippingZones);
const selectedShippingZoneId = ref<string | null>(null);

// Watch for an existing product to populate the form for editing
watch(() => props.existingProduct, (newProduct) => {
    if (newProduct) {
        product.value = { ...newProduct };
        measurement.value = newProduct.measurement ? { ...newProduct.measurement } : { ...defaultMeasurement };
        variants.value = newProduct.variants && newProduct.variants.length > 0 ? [...newProduct.variants] : [{ size: '', stock: 1 }];
        tags.value = newProduct.tags ? newProduct.tags.map(t => t.name) : [];
        if (newProduct.category) {
            const newCategory = (newProduct.category as CategoryInterface) || newProduct.category;
            selectedCategory.value = newCategory;
        }
        // Pre-fill the shipping zone if it exists
        selectedShippingZoneId.value = newProduct.shippingZoneId || null;
    }
}, { immediate: true });


const addVariant = () => variants.value.push({ size: '', stock: 1 });
const removeVariant = (index: number) => {
  if (variants.value.length > 1) {
    variants.value.splice(index, 1);
  } else {
    notify({ type: 'warn', text: 'You must have at least one size variant.' });
  }
};

const updateDescription = (newValue: string) => {
  product.value.description = newValue;
};

const validateForm = (): boolean => {
  errors.value = {};
  if (!product.value.title?.trim()) errors.value.title = 'Product name is required.';
  if (!selectedCategory.value.name) errors.value.category = 'Category is required.';
  if (!product.value.price || product.value.price <= 0) errors.value.price = 'A valid price is required.';
  if (!product.value.description || product.value.description.length < 20) errors.value.description = 'A detailed description is required.';
  if (!selectedShippingZoneId.value) errors.value.shippingZone = 'A shipping profile is required.';
  
  const validVariants = variants.value.filter(v => v.size.trim() && v.stock >= 0);
  if (validVariants.length === 0) {
    notify({ type: 'error', text: 'Please add at least one valid size with stock.' });
    return false;
  }
  if (props.mediaData.length === 0) {
    notify({ type: 'error', text: 'Please upload at least one image or video.' });
    return false;
  }
  
  return Object.keys(errors.value).length === 0;
};

const submitForm = () => { 
  if (!validateForm()) {
    notify({ type: 'error', text: 'Please correct the errors before saving.' });
    return;
  }

  const completeProduct = {
    ...product.value,
    measurement: measurement.value,
    tags: tags.value.map(tag => ({ name: tag })),
    category: selectedCategory.value,
    variants: variants.value.filter(v => v.size.trim() && v.stock >= 0),
    media: props.mediaData,
    sellerId: userStore.user?.id,
    store_name: userStore.seller?.store_name,
    shippingZoneId: selectedShippingZoneId.value,
  };

  emit('submit', completeProduct);
};

const addNewCategory = (category: CategoryInterface) => {
  categories.value.push(category);
  selectedCategory.value = category;
  showCategoryDialog.value = false;
  notify({ type: 'success', text: `Category "${category.name}" added.` });
};

onMounted(async () => {
  // Fetch categories and shipping zones in parallel for better performance
  try {
    await Promise.all([
            await categoryStore.fetchCategories(),
            await shippingStore.fetchShippingZones()
  ])
    categories.value = categoryStore.categories
  } catch (error) {
      notify({ type: 'error', text: 'Could not load form data. Please refresh.' });
  }
});
</script>