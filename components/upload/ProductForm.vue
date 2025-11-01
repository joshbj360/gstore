<template>
  <div class="relative">
    <form @submit.prevent="submitForm" class="space-y-8">
      
      <!-- Section 1: Basic Information -->
      <div class="form-section">
        <h3 class="section-title">Basic Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput v-model:input="product.title" placeholder="e.g., Silk Abaya" label="Product Name" :error="errors.title" required />
          <SelectInput v-model:input="selectedCategory.name" :categories="categories" label="Category" :error="errors.category" @open-dialog="showCategoryDialog = true" required />
        </div>
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
            <div class="flex items-center justify-between">
                <div>
                    <label for="isAccessory" class="font-medium text-gray-700 dark:text-neutral-200">Is this an Accessory?</label>
                    <p class="text-xs text-gray-500 dark:text-neutral-400">Enable if this item is styled with other products (e.g., bag, shoes).</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="product.isAccessory" id="isAccessory" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-neutral-700 peer-focus:ring-2 peer-focus:ring-[#f02c56]/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f02c56]"></div>
                </label>
            </div>
        </div>
      </div>

      <!-- Section 2: Description -->
      <div class="form-section">
        <h3 class="section-title">Description</h3>
        <RichTextEditor :model-value="product.description" @update:model-value="product.description = $event" :error="errors.description" />
      </div>

      <!-- Section 3: Pricing & Inventory -->
      <div class="form-section">
        <h3 class="section-title">Pricing & Inventory</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyInput v-model:input="product.price" label="Price" :error="errors.price" required />
            <CurrencyInput v-model:input="product.discount" label="Discount (as a decimal, e.g., 0.15)" :error="errors.discount" />
        </div>
        <div class="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
            <h4 class="text-sm font-medium text-gray-700 dark:text-neutral-200 mb-3">Sizes & Stock</h4>
            <div v-for="(variant, index) in variants" :key="index" class="flex items-center gap-2 mb-2">
                <TextInput v-model:input="variant.size" placeholder="Size (e.g., Medium)" class="flex-1" />
                <NumberInput v-model:input="variant.stock" placeholder="Stock" class="w-28" />
                 <CurrencyInput v-model:input="variant.price" placeholder="Variant Price (Optional)" class="w-36" />
                <button @click="removeVariant(index)" type="button" class="p-2 text-gray-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"><Icon name="mdi:trash-can-outline" size="20" /></button>
            </div>
            <button @click="addVariant" type="button" class="text-sm text-[#f02c56] hover:underline mt-2 font-semibold">+ Add another size</button>
        </div>
      </div>

      <!-- Section 4: Shipping Profile -->
      <div class="form-section">
        <h3 class="section-title">Shipping Profile</h3>
        <p class="text-sm text-gray-500 dark:text-neutral-400 mb-3">Choose the shipping rules for this product.</p>
        <div v-if="!sellerShippingZones || sellerShippingZones.length === 0" class="text-center p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-neutral-400">You haven't created any shipping profiles yet.</p>
            <NuxtLink to="/seller/dashboard" class="text-sm font-semibold text-[#f02c56] hover:underline mt-2 inline-block">Manage Shipping</NuxtLink>
        </div>
        <select v-else v-model="selectedShippingZoneId" class="form-input" required>
            <option disabled :value="null">-- Select a Shipping Profile --</option>
            <option v-for="zone in sellerShippingZones" :key="zone.id" :value="zone.id">{{ zone.name }}</option>
        </select>
        <p v-if="errors.shippingZone" class="form-error">{{ errors.shippingZone }}</p>
      </div>

      <!-- Section 5: "Shop the Look" -->
      <div class="form-section">
        <h3 class="section-title">Shop the Look</h3>
        <p class="text-sm text-gray-500 dark:text-neutral-400 mb-4">Link other products (e.g., accessories) styled with this item.</p>
        <div class="relative">
            <TextInput v-model:input="accessorySearchQuery" @input="debouncedSearchAccessories" placeholder="Search your products..." />
            <div v-if="accessorySearchResults.length > 0" class="absolute z-10 w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg mt-1">
                <ul>
                    <li v-for="item in accessorySearchResults" :key="item.id" @click="addLinkedProduct(item)" class="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer text-sm">{{ item.title }}</li>
                </ul>
            </div>
        </div>
        <div v-if="linkedProducts.length > 0" class="mt-4 space-y-2">
            <p class="text-xs font-semibold text-gray-500 dark:text-neutral-400">LINKED ITEMS:</p>
            <div v-for="linked in linkedProducts" :key="linked.id" class="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded-md">
                <span class="text-sm font-medium">{{ linked.title }}</span>
                <button @click="removeLinkedProduct(linked.id!)" class="p-1 text-gray-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400"><Icon name="mdi:close-circle" size="20" /></button>
            </div>
        </div>
      </div>

      <!-- Section 6: Tags -->
      <div class="form-section">
        <h3 class="section-title">Tags & Keywords</h3>
        <TagInput v-model:modelValue="tags" label="Product Tags" placeholder="Add a tag and press Enter..." />
      </div>
    </form>
    
    <div class="sticky bottom-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm border-t border-gray-200 dark:border-neutral-800 p-4 flex justify-end space-x-3">
        <button @click="$emit('discard')" type="button" class="px-6 py-2.5 border border-gray-300 dark:border-neutral-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800">Discard</button>
        <button @click="submitForm" type="button" class="px-6 py-2.5 bg-[#f02c56] text-white rounded-lg text-sm font-semibold hover:bg-[#df4949]">Save Product</button>
    </div>

    <CategoryDialog :is-open="showCategoryDialog" :is-loading="isLoadingCategory" @submit="(data) => emit('add-category', data)" @close="showCategoryDialog = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';
import { useUserStore} from '~/stores';
import { useApiService} from '~/services/api/apiService'
import type { IProduct, IMeasurement, IMedia, ICategory, IShippingZone } from '~/models';
import { useDebounceFn } from '@vueuse/core';
// Component Imports
import TextInput from '../shared/TextInput.vue';
import SelectInput from '../category/SelectInput.vue';
import TagInput from '../shared/TagInput.vue';
import RichTextEditor from '../shared/RichTextEditor.vue';
import CurrencyInput from '../shared/CurrencyInput.vue';
import NumberInput from '../shared/NumberInput.vue';
import CategoryDialog from '../category/CategoryDialog.vue';

const emit = defineEmits(['submit', 'discard', 'add-category']);
const props = defineProps({
  mediaData: { type: Array as () => IMedia[], default: () => [] },
  existingProduct: { type: Object as () => IProduct | null, default: null },
  categories: { type: Array as () => ICategory[], required: true },
  isLoadingCategory: { type: Boolean, default: false },
  sellerShippingZones: { type: Array as () => IShippingZone[], required: true }
});

const userStore = useUserStore();
const apiService = useApiService();

const product = ref<Partial<IProduct>>({ discount: 0, isAccessory: false });
const measurement = ref<Partial<IMeasurement>>({});
const tags = ref<string[]>([]);
const selectedCategory = ref<Partial<ICategory>>({});
const showCategoryDialog = ref(false);
const variants = ref([{ size: 'One Size', stock: 1, price: null as number | null }]);
const selectedShippingZoneId = ref<string | null>(null);
const errors = ref<Record<string, string>>({});
const accessorySearchQuery = ref('');
const accessorySearchResults = ref<Partial<IProduct>[]>([]);
const linkedProducts = ref<Partial<IProduct>[]>([]);

// Watcher to populate form when editing
watch(() => props.existingProduct, (newProduct) => {
  if (newProduct) {
    product.value = { ...newProduct };
    measurement.value = newProduct.measurement || {};
    variants.value = newProduct.variants?.length ? newProduct.variants.map(v => ({...v})) : [{ size: 'One Size', stock: 1, price: null }];
    tags.value = newProduct.tags ? newProduct.tags.map((t:any) => t.tag.name) : [];
    if (newProduct.category?.length) {
      selectedCategory.value = { name: newProduct.category[0].category.name };
    }
    selectedShippingZoneId.value = newProduct.shippingZoneId || null;
  }
}, { immediate: true });

const debouncedSearchAccessories = useDebounceFn(async () => {
    if (accessorySearchQuery.value.length < 2) {
        accessorySearchResults.value = []; return;
    }
    const results = await apiService.searchProducts(accessorySearchQuery.value);
    accessorySearchResults.value = results;
}, 300);

const addLinkedProduct = (item: Partial<IProduct>) => {
    if (!linkedProducts.value.some(p => p.id === item.id)) linkedProducts.value.push(item);
    accessorySearchQuery.value = '';
    accessorySearchResults.value = [];
};
const removeLinkedProduct = (itemId: number) => {
    linkedProducts.value = linkedProducts.value.filter(p => p.id !== itemId);
};
const addVariant = () => variants.value.push({ size: '', stock: 0, price: null });
const removeVariant = (index: number) => { if (variants.value.length > 1) variants.value.splice(index, 1); };

const validateForm = (): boolean => {
    errors.value = {};
    if (!product.value.title) errors.value.title = 'Product name is required.';
    if (!selectedCategory.value.name) errors.value.category = 'Category is required.';
    if (product.value.price === undefined || product.value.price === null) errors.value.price = 'Price is required.';
    if (!selectedShippingZoneId.value) errors.value.shippingZone = 'Shipping profile is required.';
    return Object.keys(errors.value).length === 0;
};

const submitForm = () => { 
  if (!validateForm()) return;
  const completeProduct = {
    ...product.value,
    measurement: measurement.value,
    tags: tags.value.map(tag => ({ name: tag })),
    category: { name: selectedCategory.value.name },
    variants: variants.value.filter(v => v.size.trim() && v.stock >= 0),
    media: props.mediaData, // This is passed up to the parent
    shippingZoneId: selectedShippingZoneId.value,
    linkedProductIds: linkedProducts.value.map(p => p.id)
  };
  emit('submit', completeProduct);
};
</script>

<style scoped>
.form-section { @apply p-6 border rounded-lg bg-white dark:bg-neutral-900 shadow-sm border-gray-200 dark:border-neutral-800; }
.section-title { @apply text-lg font-semibold text-gray-800 dark:text-neutral-100 mb-4; }
.form-input { @apply mt-1 block w-full border border-gray-300 dark:border-neutral-700 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100; }
.form-error { @apply text-red-500 text-xs mt-1; }
</style>

