<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold">Product Information</h2>
      <p class="text-sm text-gray-500">Fill in the details about your product</p>
    </div>

    <!-- Basic Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextInput
        v-model:input="product.title"
        placeholder="e.g., Cotton T-Shirt"
        label="Product Name"
        :error="errors.title"
        @input="clearError('title')"
        required
      />

      <SelectInput
        v-model:input="selectedCategory.name"
        :categories="categories"
        label="Category"
        :error="errors.category"
        @open-dialog="toggleCategoryDialog"
        required
      />
    </div>

    <!-- Rich Text Editor -->
    <div>
      <label class="block  text-sm font-medium text-gray-700 mb-1">Description</label>
      <RichTextEditor
      :model-value="product.description"
      @update:model-value="updateDescription"
      label="Detailed Description"
      :error="descriptionError"
    />
    </div>

    <!-- Pricing & Inventory -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CurrencyInput
        v-model:input="product.price"
        label="Price"
        :error="errors.price"
        @input="clearError('price')"
        required
      />

      <CurrencyInput
        v-model:input="product.discount"
        label="Discount Price"
        :error="errors.discount"
        @input="clearError('discount')"
      />

    <div>
  <h3 class="text-sm font-medium text-gray-700 mb-2">Sizes & Inventory</h3>
  <div v-for="(variant, index) in variants" :key="index" class="flex items-center gap-2 mb-2">
    <TextInput v-model:input="variant.size" placeholder="Size (e.g., Medium)" class="flex-1" />
    <NumberInput v-model:input="variant.stock" placeholder="Stock" class="w-24" />
    <button @click="removeVariant(index)" type="button" class="p-2 text-gray-400 hover:text-red-500">
      <Icon name="mdi:trash-can-outline" size="20" />
    </button>
  </div>
  <button @click="addVariant" type="button" class="text-sm text-[#f02c56] hover:underline mt-2">
    + Add another size
  </button>
</div>
    </div>
    

    <!-- Shipping Details -->
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-gray-700">Shipping Information</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NumberInput
          v-model:input="measurement.length"
          label="Length (cm)"
          :error="errors.length"
          @input="clearError('length')"
        />

        <NumberInput
          v-model:input="measurement.width"
          label="Width (cm)"
          :error="errors.width"
          @input="clearError('width')"
        />

        <NumberInput
          v-model:input="measurement.height"
          label="Height (cm)"
          :error="errors.height"
          @input="clearError('height')"
        />

        <NumberInput
          v-model:input="measurement.weight"
          label="Weight (kg)"
          :error="errors.weight"
          @input="clearError('weight')"
        />
      </div>
    </div>

    <!-- Tags -->
    <TagInput
      v-model:modelValue="tags"
      label="Product Tags"
      placeholder="e.g., summer, casual"
      :error="errors.tags"
      @input="clearError('tags')"
    />

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-6">
      <button
        @click="$emit('discard')"
        type="button"
        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Discard
      </button>
      <button
        @click="submitForm"
        type="button"
        class="px-4 py-2 bg-[#F02C56] text-white rounded-md text-sm font-medium hover:bg-[#df4949]"
      >
        Save Product
      </button>
    </div>

    <!-- Category Dialog -->
    <CategoryDialog
      v-if="showCategoryDialog"
      v-model="showCategoryDialog"
      @submit="addNewCategory"
      @close="closeCategoryDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCategoryStore } from '~/stores/categories.store';
import { defaultProduct, type ProductInterface } from '~/models/interface/products/product.interface';
import { defaultMeasurement, type MeasurementInterface } from '~/models/interface/products/measurement.interface';
import type { MediaInterface } from '~/models/interface/products/media.interface';
import { defaultCategory, type CategoryInterface } from '~/models/interface/products/category.interface';
import { useUserStore } from '@/stores/user.store'
import TextInput from '../shared/TextInput.vue';
import SelectInput from '../category/SelectInput.vue'
import TagInput from '../shared/TagInput.vue';
import RichTextEditor from '../shared/RichTextEditor.vue';
import CurrencyInput from '../shared/CurrencyInput.vue';
import NumberInput from '../shared/NumberInput.vue';
import CategoryDialog from '../category/CategoryDialog.vue';
import seller from '~/middleware/seller';


const emit = defineEmits(['submit', 'discard']);

const props = defineProps({
  mediaData: {
    type: Array as () => MediaInterface[],
    default: () => []
  }
});

const categoryStore = useCategoryStore();
const userStore = useUserStore()
const categories =ref<CategoryInterface[]>([])

// 1. Reactive state for variants, starts with one empty row
const variants = ref([{ size: '', stock: 0 }]);

// 2. Function to add a new, empty variant row
const addVariant = () => {
  variants.value.push({ size: '', stock: 0 });
};

// 3. Function to remove a variant by its index
const removeVariant = (index: number) => {
  // Prevents removing the very last row
  if (variants.value.length > 1) {
    variants.value.splice(index, 1);
  }
};

// Form Data
const product = ref<ProductInterface>({ ...defaultProduct });
const measurement = ref<MeasurementInterface>({ ...defaultMeasurement });
const tags = ref<string[]>([]);
const selectedCategory = ref<CategoryInterface>(defaultCategory);
const showCategoryDialog = ref(false);
const newCategoryName = ref('');
const newCategoryThumbnail = ref('');

// Form Validation
const errors = ref<Record<string, string>>({});

const canSubmit = computed(() => {
  return (
    product.value.title?.trim() &&
    product.value.description?.trim() &&
    selectedCategory.value.name &&
    product.value.price > 0 &&
    product.value.variants.every(variant => variant.stock >= 0) &&
    props.mediaData.length > 0
  );

});

// Methods
const submitForm = () => { 
  if (!validateForm()) return;

  const completeProduct = {
    ...product.value,
    measurement: measurement.value,
    slug:product.value.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    tags: tags.value.map(tag => ({ name: tag })),
    category: selectedCategory.value,
    variants: product.value.variants.filter(variant => variant.size.trim() && variant.stock >= 0),
    media: props.mediaData,
    sellerId: userStore.user?.id, // Add sellerId from userStore
    store_name: userStore.seller?.store_name
  };

  emit('submit', completeProduct);
};

const validateForm = () => {
  errors.value = {};
  if (!userStore.seller?.store_name){
    alert('No seller selected!')
  } 
  if (!product.value.title?.trim()) {
    errors.value.title = 'Product name is required';
  }
  if (!product.value.description?.trim()) {
    errors.value.description = 'Description is required';
  }
  if (!selectedCategory.value.name) {
    errors.value.category = 'Category is required';
  }
  if (product.value.price <= 0) {
    errors.value.price = 'Valid price is required';
  }
  if (product.value.variants.some(variant => variant.stock < 0)) {
    errors.value.stock = 'Valid stock quantity is required';
  }
  if (props.mediaData.length === 0) {
    errors.value.media = '';
    alert("At least one image is required")
  }

  return Object.keys(errors.value).length === 0;
};

const clearError = (field: string) => {
  if (errors.value[field]) {
    delete errors.value[field];
  }
};


// Category Management
const toggleCategoryDialog = () => {
  showCategoryDialog.value = !showCategoryDialog.value;
};

const closeCategoryDialog = () => {
  showCategoryDialog.value = false;
  newCategoryName.value = '';
  newCategoryThumbnail.value = '';
};

const addNewCategory = async (category: { name: string; thumbnailCatUrl: string }) => {
  try {
    // await categoryStore.addCategory({
    //   name: category.name,
    //   thumbnailUrl: category.thumbnail
    // });
    categories.value.push(category)
    selectedCategory.value = category
    closeCategoryDialog();
  } catch (err) {
    errors.value.category = 'Failed to add category';
  }
};

onBeforeMount(async () => {
  await categoryStore.fetchCategories()
  categories.value = categoryStore.categories
})

const descriptionError = ref('');

const updateDescription = (newValue: string) => {
  product.value.description = newValue;
  
  // Optional validation
  if (newValue.length < 20) {
    descriptionError.value = 'Description must be at least 20 characters';
  } else {
    descriptionError.value = '';
  }
}
</script>