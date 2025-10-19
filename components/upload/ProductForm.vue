<template>
  <div class="relative">
    <form @submit.prevent="submitForm" class="space-y-8">
      
      <!-- Section 1: Basic Information -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput v-model:input="product.title" placeholder="e.g., Silk Abaya with Embroidery" label="Product Name" :error="errors.title" required />
          <SelectInput v-model:input="selectedCategory.name" :categories="categories" label="Category" :error="errors.category" @open-dialog="showCategoryDialog = true" required />
        </div>
        
        <!-- NEW: Is Accessory Toggle Switch -->
        <div class="mt-6 pt-4 border-t">
            <div class="flex items-center justify-between">
                <div>
                    <label for="isAccessory" class="font-medium text-gray-700">Is this an Accessory?</label>
                    <p class="text-xs text-gray-500">Enable this if the item is meant to be styled with other products (e.g., a bag, shoes, jewelry).</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="product.isAccessory" id="isAccessory" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#f02c56]/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
            </div>
        </div>
      </div>

      <!-- Section 2: Description -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Description</h3>
        <RichTextEditor :model-value="product.description" @update:model-value="product.description = $event" :error="errors.description" />
      </div>

      <!-- Section 3: Pricing & Inventory -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Pricing & Inventory</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyInput v-model:input="product.price" label="Price" :error="errors.price" required />
            <CurrencyInput v-model:input="product.discount" label="Discount (as a decimal, e.g., 0.15 for 15%)" :error="errors.discount" />
        </div>
        <div class="mt-6 p-4 border rounded-md bg-gray-50">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Sizes & Stock</h4>
            <div v-for="(variant, index) in variants" :key="index" class="flex items-center gap-2 mb-2">
                <TextInput v-model:input="variant.size" placeholder="Size (e.g., Medium, 42)" class="flex-1" />
                <NumberInput v-model:input="variant.stock" placeholder="Stock" class="w-28" />
                 <CurrencyInput v-model:input="variant.price" placeholder="Variant Price (Optional)" class="w-36" />
                <button @click="removeVariant(index)" type="button" class="p-2 text-gray-400 hover:text-brand rounded-full hover:bg-gray-200"><Icon name="mdi:trash-can-outline" size="20" /></button>
            </div>
            <button @click="addVariant" type="button" class="text-sm text-brand hover:underline mt-2 font-semibold">+ Add another size</button>
        </div>
      </div>

      <!-- Section 4: Shipping Profile -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Shipping Profile</h3>
        <p class="text-sm text-gray-500 mb-3">Choose the shipping rules for this product.</p>
        <div v-if="!sellerShippingZones || sellerShippingZones.length === 0" class="text-center p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600">You haven't created any shipping profiles yet.</p>
            <NuxtLink to="/seller/dashboard/shipping" class="text-sm font-semibold text-brand hover:underline mt-2 inline-block">Create a Shipping Profile</NuxtLink>
        </div>
        <select v-else v-model="selectedShippingZoneId" class="form-input" required>
            <option disabled :value="null">-- Select a Shipping Profile --</option>
            <option v-for="zone in sellerShippingZones" :key="zone.id" :value="zone.id">{{ zone.name }}</option>
        </select>
        <p v-if="errors.shippingZone" class="form-error">{{ errors.shippingZone }}</p>
      </div>

      <!-- Section 5: "Shop the Look" -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Shop the Look</h3>
        <p class="text-sm text-gray-500 mb-4">Link other products (e.g., accessories) styled with this item.</p>
        <div class="relative">
            <TextInput v-model:input="accessorySearchQuery" @input="debouncedSearchAccessories" placeholder="Search your products..." />
            <div v-if="accessorySearchResults.length > 0" class="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
                <ul>
                    <li v-for="item in accessorySearchResults" :key="item.id" @click="addLinkedProduct(item)" class="p-2 hover:bg-gray-100 cursor-pointer text-sm">{{ item.title }}</li>
                </ul>
            </div>
        </div>
        <div v-if="linkedProducts.length > 0" class="mt-4 space-y-2">
            <p class="text-xs font-semibold text-gray-500">LINKED ITEMS:</p>
            <div v-for="linked in linkedProducts" :key="linked.id" class="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <span class="text-sm font-medium">{{ linked.title }}</span>
                <button @click="removeLinkedProduct(linked.id!)" class="p-1 text-gray-400 hover:text-brand"><Icon name="mdi:close-circle" size="20" /></button>
            </div>
        </div>
      </div>

      <!-- Section 6: Tags -->
      <div class="p-6 border rounded-lg bg-white shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Tags & Keywords</h3>
        <TagInput v-model:modelValue="tags" label="Product Tags" placeholder="Add a tag and press Enter..." />
      </div>
    </form>
    
    <div class="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t p-4 flex justify-end space-x-3">
        <button @click="$emit('discard')" type="button" class="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Discard</button>
        <button @click="submitForm" type="button" class="px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-[#df4949]">Save Product</button>
    </div>

    <CategoryDialog :is-open="showCategoryDialog" :is-loading="isLoadingCategory" @submit="(data) => emit('add-category', data)" @close="showCategoryDialog = false" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';
import { useUserStore} from '~/stores';
import { useApiService } from '~/services/api/apiService';
import type { IProduct, IMeasurement, IMedia, ICategory, IShippingZone } from '~/models';
import { useDebounceFn } from '@vueuse/core';
import { notify } from "@kyvg/vue3-notification";
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

const product = ref<Partial<IProduct>>({});
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

watch(() => props.existingProduct, (newProduct) => {
  if (newProduct) {
    product.value = { ...newProduct };
    // ... logic to populate form
  }
}, { immediate: true });

const debouncedSearchAccessories = useDebounceFn(async () => {
    if (accessorySearchQuery.value.length < 2) {
        accessorySearchResults.value = [];
        return;
    }
    const results = await apiService.searchSellerProducts(accessorySearchQuery.value);
    accessorySearchResults.value = results;
}, 300);

const addLinkedProduct = (item: Partial<IProduct>) => { /* ... */ };
const removeLinkedProduct = (itemId: number) => { /* ... */ };
const addVariant = () => variants.value.push({ size: '', stock: 0, price: null });
const removeVariant = (index: number) => { if (variants.value.length > 1) variants.value.splice(index, 1); };
const updateDescription = (newValue: string) => { product.value.description = newValue; };

const validateForm = (): boolean => {
     errors.value = {};
    if (!product.value.title) errors.value.title = 'Product name is required.';
    if (!selectedCategory.value.name) errors.value.category = 'Category is required.';
    if (!product.value.price) errors.value.price = 'Price is required.';
    if (!selectedShippingZoneId.value) errors.value.shippingZone = 'Shipping profile is required.';
    return Object.keys(errors.value).length === 0;
};

const submitForm = () => { 
  if (!validateForm()) return;
  const completeProduct = {
    ...product.value,
    isAccessory: product.value.isAccessory || false,
    measurement: measurement.value,
    tags: tags.value.map(tag => ({ name: tag })),
    category: { name: selectedCategory.value.name },
    variants: variants.value.filter(v => v.size.trim() && v.stock >= 0),
    media: props.mediaData,
    sellerId: userStore.user?.id,
    store_slug: userStore.sellerProfile?.store_slug,
    shippingZoneId: selectedShippingZoneId.value,
    linkedProductIds: linkedProducts.value.map(p => p.id)
  };
  emit('submit', completeProduct);
};
</script>

<style scoped>
.form-input { @apply mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent; }
.form-error { @apply text-brand text-xs mt-1; }
</style>

