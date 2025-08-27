<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-10">
        <div class="container mx-auto px-4 py-3 flex items-center justify-between">
            <NuxtLink to="/" class="text-gray-600 hover:text-gray-900">
                <Icon name="mdi:close" size="24"/>
            </NuxtLink>
            <h1 class="font-semibold">Quick Add Product</h1>
            <button @click="postProduct" :disabled="!canPost || isUploading" class="text-sm font-bold text-[#C42B78] disabled:text-gray-400">
                {{ isUploading ? 'Posting...' : 'Post' }}
            </button>
        </div>
    </header>

    <main class="p-4">
        <div v-if="mediaData.length === 0">
            <label for="media-upload" class="relative block w-full h-64 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center cursor-pointer bg-white hover:bg-gray-50">
                <Icon name="mdi:camera-plus-outline" size="48" class="text-gray-400"/>
                <span class="mt-2 text-sm font-medium text-gray-600">Tap to upload photos/videos</span>
                <p class="text-xs text-gray-500">Start with your best shot</p>
            </label>
            <input id="media-upload" type="file" multiple accept="image/*,video/*" class="hidden" @change="handleFileSelection">
        </div>

        <div v-else class="space-y-4">
            <div class="w-full aspect-square rounded-lg overflow-hidden bg-gray-200">
                <img v-if="mediaData[0].type === 'IMAGE'" :src="mediaData[0].url" class="w-full h-full object-cover" />
                <video v-else :src="mediaData[0].url" class="w-full h-full object-cover" autoplay muted loop playsinline></video>
            </div>
            
            <div class="grid grid-cols-4 gap-2">
                <div v-for="(media, index) in mediaData.slice(1, 4)" :key="index" class="aspect-square rounded-md bg-gray-100">
                    <img :src="media.url" class="w-full h-full object-cover rounded-md" />
                </div>
                 <label for="media-upload" v-if="mediaData.length < 10" class="aspect-square rounded-md border-2 border-dashed flex items-center justify-center text-gray-400">
                    <Icon name="mdi:plus" size="24" />
                </label>
            </div>

            <div class="space-y-4 pt-4">
                <TextInput v-model:input="product.title" label="Title" placeholder="What are you selling?" required />
                <CurrencyInput v-model:input="product.price" label="Price" required />
                <SelectInput v-model:input="selectedCategory.name" :categories="categories" label="Category" @open-dialog="showCategoryDialog = true" required />
            </div>
        </div>
    </main>

    <CategoryDialog v-if="showCategoryDialog" @submit="addNewCategory" @close="showCategoryDialog = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore, useUserStore, useCategoryStore } from '~/stores';
import { notify } from "@kyvg/vue3-notification";
import  {type MediaInterface, MediaType } from '~/models/interface/products/media.interface';
import TextInput from '~/components/shared/TextInput.vue';
import CurrencyInput from '~/components/shared/CurrencyInput.vue';
import SelectInput from '~/components/category/SelectInput.vue';
import CategoryDialog from '~/components/category/CategoryDialog.vue';
import { type ProductInterface, defaultProduct } from '~/models/interface/products/product.interface';
import { type CategoryInterface, defaultCategory } from '~/models/interface/products/category.interface';

definePageMeta({ layout: false }); // Use a custom, minimal layout

const router = useRouter();
const userStore = useUserStore();
const productStore = useProductStore();
const categoryStore = useCategoryStore();

const isUploading = ref(false);
const mediaData = ref<MediaInterface[]>([]);
const product = ref<Partial<ProductInterface>>({ ...defaultProduct });
const selectedCategory = ref<CategoryInterface>(defaultCategory);
const categories = ref<CategoryInterface[]>([]);
const showCategoryDialog = ref(false);

const canPost = computed(() => {
    return product.value.title && product.value.price && selectedCategory.value.name && mediaData.value.length > 0;
});

// This simulates uploading the file and getting a URL back
const uploadFile = async (file: File): Promise<MediaInterface> => {
    // In a real app, this would call your Cloudinary upload function
    // For this demo, we'll use a FileReader to get a local URL for preview
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve({
                url: e.target?.result as string,
                type: file.type.startsWith('video') ? MediaType.VIDEO : MediaType.IMAGE,
                format: file.type.split('/')[1],
            });
        };
        reader.readAsDataURL(file);
    });
};

const handleFileSelection = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;

    isUploading.value = true;
    notify({ type: 'info', text: 'Processing media...' });
    
    const files = Array.from(input.files);
    for (const file of files) {
        const uploadedMedia = await uploadFile(file);
        mediaData.value.push(uploadedMedia);
    }

    isUploading.value = false;
};

const postProduct = async () => {
    if (!canPost.value) return;
    isUploading.value = true;
    try {
        const completeProduct = {
            ...defaultProduct,
            title: product.value.title!,
            price: product.value.price!,
            category: selectedCategory.value,
            media: mediaData.value,
            sellerId: userStore.user?.id,
            store_name: userStore.seller?.store_name ?? '',
            // Quick-add products can have a simple slug and a default variant
            slug: product.value.title!.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            variants: [{ size: 'One Size', stock: 1 }],
        };
        const createdProduct = await productStore.createProduct(completeProduct);
        if (createdProduct) {
            notify({ type: 'success', text: 'Product posted successfully!' });
            router.push(`/product/${createdProduct.id}`);
        }
    } catch (err: any) {
        notify({ type: 'error', text: err.message || 'Failed to post product.' });
    } finally {
        isUploading.value = false;
    }
};

const addNewCategory = (category: CategoryInterface) => {
  categories.value.push(category);
  selectedCategory.value = category;
  showCategoryDialog.value = false;
};

onMounted(async () => {
  if (!userStore.isLoggedIn) {
      router.push('/auth/login');
      return;
  }
  if (categoryStore.categories.length === 0) {
    await categoryStore.fetchCategories();
  }
  categories.value = categoryStore.categories;
});
</script>