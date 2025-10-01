<template>
  <div class="relative">
    <form @submit.prevent="submitForm" class="space-y-8 pb-24">
      
      <!-- Section 1: Basic Information -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput v-model:input="product.title" placeholder="e.g., Silk Abaya with Embroidery" label="Product Name" :error="errors.title" required />
          <SelectInput v-model:input="selectedCategory.name" :categories="categories" label="Category" :error="errors.category" @open-dialog="showCategoryDialog = true" required />
        </div>
      </div>

      <!-- Section 2: Description -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Description</h3>
        <RichTextEditor :model-value="product.description" @update:model-value="updateDescription" :error="errors.description" />
      </div>

      <!-- Section 3: Pricing & Inventory -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Pricing & Inventory</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CurrencyInput v-model:input="product.price" label="Price" :error="errors.price" required />
          <CurrencyInput v-model:input="product.discount  " label="Discount (as a decimal, e.g., 0.15 for 15%)" :error="errors.discount" />
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
          <button @click="addVariant" type="button" class="text-sm text-[#f02c56] hover:underline mt-2 font-semibold">+ Add another size</button>
        </div>
      </div>

      <!-- Section 4: Shipping Profile -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Shipping Profile</h3>
        <p class="text-sm text-gray-500 mb-3">Choose the shipping rules for this product.</p>
        
        <div v-if="sellerShippingZones.length === 0" class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600">You haven't created any shipping profiles yet.</p>
          <NuxtLink to="/seller/dashboard/shipping" class="text-sm font-semibold text-[#f02c56] hover:underline mt-2 inline-block">Create a Shipping Profile</NuxtLink>
        </div>
        <select v-else v-model="selectedShippingZoneId" class="form-input" required>
          <option disabled :value="null">-- Select a Shipping Profile --</option>
          <option v-for="zone in sellerShippingZones" :key="zone.id" :value="zone.id">{{ zone.name }}</option>
        </select>
        <p v-if="errors.shippingZone" class="form-error">{{ errors.shippingZone }}</p>
      </div>

      <!-- Section 5: Tags -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Tags & Keywords</h3>
        <TagInput v-model:modelValue="tags" label="Product Tags" placeholder="Add a tag and press Enter..." />
      </div>
    </form>
    
    <!-- Sticky Footer for Form Actions -->
    <div class="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t p-4 flex justify-end space-x-3">
      <button @click="$emit('discard')" type="button" class="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Discard</button>
      <button @click="submitForm" type="button" class="px-6 py-2.5 bg-[#F02C56] text-white rounded-lg text-sm font-semibold hover:bg-[#df4949] transition-colors">Save Product</button>
    </div>

    <CategoryDialog v-if="showCategoryDialog" @submit="addNewCategory" @close="showCategoryDialog = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';
import { useUserStore } from '~/stores';
import type { IProduct, IMeasurement, IMedia, ICategory, IShippingZone } from '~/models';
import { defaultMeasurement, defaultCategory, defaultProduct } from '~/models';
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

// This component is now "dumb" and receives all necessary data as props.
const props = defineProps({
  mediaData: { type: Array as () => IMedia[], default: () => [] },
  existingProduct: { type: Object as () => IProduct | null, default: null },
  categories: { type: Array as () => ICategory[], required: true },
  sellerShippingZones: { type: Array as () => IShippingZone[], required: true }
});

const userStore = useUserStore();

// Form Data
const product = ref<Partial<IProduct>>({...defaultProduct });
const measurement = ref<IMeasurement>({ ...defaultMeasurement });
const tags = ref<string[]>([]);
const selectedCategory = ref<Partial<ICategory>>({ ...defaultCategory });
const showCategoryDialog = ref(false);
const variants = ref([{ size: 'One Size', stock: 1, price: 0 }]);
const selectedShippingZoneId = ref<string | null>(null);
const errors = ref<Record<string, string>>({});

// Watch for an existing product to populate the form for editing
watch(() => props.existingProduct, (newProduct) => {
  if (newProduct) {
    product.value = { ...newProduct };
    measurement.value = newProduct.measurement ? { ...newProduct.measurement } : { ...defaultMeasurement };
    variants.value = newProduct.variants && newProduct.variants.length > 0 ? [...newProduct.variants] : [{ size: 'One Size', stock: 1, price: 0 }];
    tags.value = newProduct.tags ? newProduct.tags.map(t => t.tag.name) : [];
    if (newProduct.category?.length) {
        selectedCategory.value = { name: newProduct.category[0].category.name };
    }
    selectedShippingZoneId.value = newProduct.shippingZoneId || null;
  }
}, { immediate: true });

const addVariant = () => variants.value.push({ size: '', stock: 0, price: 0});
const removeVariant = (index: number) => {
  if (variants.value.length > 1) variants.value.splice(index, 1);
};
const updateDescription = (newValue: string) => { product.value.description = newValue; };

const validateForm = (): boolean => {
  // ... validation logic ...
  return true;
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
    category: { name: selectedCategory.value.name },
    variants: variants.value.filter(v => v.size.trim() && v.stock >= 0 && v.price >= 0  ),
    media: props.mediaData,
    sellerId: userStore.user?.id,
    store_name: userStore.sellerProfile?.store_name,
    shippingZoneId: selectedShippingZoneId.value,
  };
  emit('submit', completeProduct);
};

const addNewCategory = (category: ICategory) => {
    props.categories.push(category);
    selectedCategory.value = category;
    showCategoryDialog.value = false;
};
</script>

<style scoped>
.form-input { @apply mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent; }
.form-error { @apply text-red-500 text-xs mt-1; }
</style>
