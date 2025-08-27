<template>
  <!-- The main form container with a relative class for the sticky footer -->
  <div class="relative">
    <form @submit.prevent="submitForm" class="space-y-8 pb-24">
      
      <!-- Section 1: Basic Information -->
      <div class="p-6 border rounded-lg bg-white">
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

            class="z-10"
          />
        </div>
      </div>

      <!-- Section 2: Description -->
      <div class="p-6 border rounded-lg bg-white">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Description</h3>
        <RichTextEditor
          :model-value="product.description"
          @update:model-value="updateDescription"
          :error="errors.description"
        />
      </div>

      <!-- Section 3: Pricing & Inventory -->
      <div class="p-6 border rounded-lg bg-white">
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
            <button @click="addVariant" type="button" class="text-sm text-[#C42B78] hover:underline mt-2 font-semibold">
                + Add another size
            </button>
        </div>
      </div>

      <!-- Section 4: Shipping -->
       <div class="p-6 border rounded-lg bg-white">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Shipping Details (Optional)</h3>
         <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumberInput v-model:input="measurement.length" label="Length (cm)" />
            <NumberInput v-model:input="measurement.width" label="Width (cm)" />
            <NumberInput v-model:input="measurement.height" label="Height (cm)" />
            <NumberInput v-model:input="measurement.weight" label="Weight (kg)" />
         </div>
      </div>

      <!-- Section 5: Tags -->
      <div class="p-6 border rounded-lg bg-white">
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
        <button @click="submitForm" type="button" class="px-6 py-2.5 bg-[#C42B78] text-white rounded-lg text-sm font-semibold hover:bg-[#df4949] transition-colors">
            Save Product
        </button>
    </div>

    <!-- Category Dialog -->
    <CategoryDialog
      v-if="showCategoryDialog"
      @submit="addNewCategory"
      @close="showCategoryDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCategoryStore, useUserStore } from '~/stores';
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
const categories = ref<CategoryInterface[]>([]);

// Form Data
const product = ref<Partial<ProductInterface>>({ ...defaultProduct });
const measurement = ref<MeasurementInterface>({ ...defaultMeasurement });
const tags = ref<string[]>([]);
const selectedCategory = ref<CategoryInterface>(defaultCategory);
const showCategoryDialog = ref(false);
const variants = ref([{ size: '', stock: 1 }]);

// Form Validation
const errors = ref<Record<string, string>>({});

// Variant Management
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
    slug: product.value.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    tags: tags.value.map(tag => ({ name: tag })),
    category: selectedCategory.value,
    variants: variants.value.filter(v => v.size.trim() && v.stock >= 0),
    media: props.mediaData,
    sellerId: userStore.user?.id,
    store_name: userStore.seller?.store_name,
  };

  emit('submit', completeProduct);
};
// NEW: Watch for an existing product and populate the form
watch(() => props.existingProduct, (newProduct) => {
    if (newProduct) {
        product.value = { ...newProduct };
        variants.value = newProduct.variants && newProduct.variants.length > 0 ? [...newProduct.variants] : [{ size: '', stock: 1 }];
        tags.value = newProduct.tags ? newProduct.tags.map(t => t.name) : [];
        if (newProduct.category) {
            // Assuming category is an object with a name property
            const categoryName = (newProduct.category as any).name || newProduct.category;
            selectedCategory.value = { name: categoryName };
        }
    }
}, { immediate: true }); // immediate: true runs the watcher on component mount

const addNewCategory = (category: CategoryInterface) => {
  categories.value.push(category);
  selectedCategory.value = category;
  showCategoryDialog.value = false;
  notify({ type: 'success', text: `Category "${category.name}" added.` });
};

onMounted(async () => {
  if (categoryStore.categories.length === 0) {
    await categoryStore.fetchCategories();
  }
  categories.value = categoryStore.categories;
});
</script>