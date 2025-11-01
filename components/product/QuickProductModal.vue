<template>
    <transition
        enter-active-class="transition-opacity duration-300 ease-out"
        leave-active-class="transition-opacity duration-300 ease-in"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
    >
        <div v-if="isOpen" class="fixed inset-0 bg-black/60 z-40" @click="$emit('close')"></div>
    </transition>
    
    <transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in"
        enter-from-class="translate-y-full sm:translate-y-0 sm:opacity-0"
        leave-to-class="translate-y-full sm:translate-y-0 sm:opacity-0"
    >
        <div 
            v-if="isOpen" 
            class="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-w-md w-full z-50" 
            role="dialog" 
            aria-modal="true"
        >
            <div @click.stop class="bg-white dark:bg-neutral-900 w-full max-h-[85vh] sm:rounded-lg shadow-xl flex flex-col">
                <!-- Modal Header -->
                <header class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-neutral-800 shrink-0">
                    <button @click="$emit('close')" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
                        <Icon name="mdi:close" size="20" class="text-gray-600 dark:text-neutral-300" />
                    </button>
                    <h1 class="font-semibold text-gray-900 dark:text-neutral-100">Quick Add Product</h1>
                    <button @click="postProduct" :disabled="!canPost || isUploading" class="text-sm font-bold text-[#f02c56] disabled:text-gray-400 dark:disabled:text-neutral-600">
                        {{ isUploading ? 'Posting...' : 'Post' }}
                    </button>
                </header>

                <!-- Scrollable Content -->
                <main class="flex-1 overflow-y-auto p-4">
                    <div v-if="mediaData.length === 0" class="mb-4">
                        <UploadWidget 
                            :allow-multiple="true"
                            :alt-text="'product'"
                            @upload-start="isUploading = true"
                            @upload-complete="handleMediaUpload"
                            @upload-error="handleUploadError"
                        />
                    </div>

                    <div v-else class="space-y-4">
                        <div class="w-full aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-neutral-800">
                            <img v-if="mediaData[0].type === 'IMAGE'" :src="mediaData[0].url" class="w-full h-full object-cover" />
                            <video v-else :src="mediaData[0].url" class="w-full h-full object-cover" autoplay muted loop playsinline></video>
                        </div>
                        
                        <div class="grid grid-cols-4 gap-2">
                            <div v-for="(media, index) in mediaData.slice(1, 4)" :key="index" class="aspect-square rounded-md bg-gray-100 dark:bg-neutral-800">
                                <img :src="media.url" class="w-full h-full object-cover rounded-md" />
                            </div>
                        </div>

                        <div class="space-y-4 pt-4">
                            <TextInput v-model:input="product.title" label="Title" placeholder="What are you selling?" required />
                            <CurrencyInput v-model:input="product.price" label="Price" required />
                            <SelectInput v-model:input="selectedCategory.name" :categories="categories" label="Category" @open-dialog="showCategoryDialog = true" required />
                        </div>
                    </div>
                </main>

                <CategoryDialog 
                    :is-open="showCategoryDialog" 
                    :is-loading="categoryStore.isLoading"
                    @submit="addNewCategory" 
                    @close="showCategoryDialog = false" 
                />
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore, useUserStore, useCategoryStore} from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { notify } from "@kyvg/vue3-notification";
import type { IMedia, IProduct, ICategory } from '~/models';
import { EMediaType, defaultProduct, defaultCategory } from '~/models';
import TextInput from '~/components/shared/TextInput.vue';
import CurrencyInput from '~/components/shared/CurrencyInput.vue';
import SelectInput from '~/components/category/SelectInput.vue';
import CategoryDialog from '~/components/category/CategoryDialog.vue';
import UploadWidget from '~/components/upload/UploadWidget.vue';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close', 'posted']);

const router = useRouter();
const userStore = useUserStore();
const productStore = useProductStore();
const categoryStore = useCategoryStore();
const apiService = useApiService();

const isUploading = ref(false);
const mediaData = ref<IMedia[]>([]);
const product = ref<Partial<IProduct>>({});
const selectedCategory = ref<Partial<ICategory>>({});
const showCategoryDialog = ref(false);

const { data: data, refresh } = useLazyAsyncData(
    'categories-quick-add',
    () => categoryStore.fetchCategories(),
    { default: () => [] }
);

const categories = computed(() => categoryStore.categories);

const canPost = computed(() => {
    return product.value.title && product.value.price && selectedCategory.value.name && mediaData.value.length > 0;
});

const handleMediaUpload = (uploadedMedia: IMedia[]) => {
    mediaData.value = uploadedMedia;
    isUploading.value = false;
    notify({ type: 'success', text: 'Media added!' });
};
const handleUploadError = (error: string) => {
    isUploading.value = false;
    notify({ type: 'error', text: error });
};

const postProduct = async () => {
    if (!canPost.value) return;
    isUploading.value = true;
    
    try {
        const createdProduct = await apiService.quickCreateProduct({
            title: product.value.title!,
            price: product.value.price!,
            categoryName: selectedCategory.value.name!,
            media: mediaData.value,
        });

        if (createdProduct) {
            notify({ type: 'success', text: 'Product posted successfully!' });
            productStore.products.unshift(createdProduct); // Optimistically update store
            productStore.productMap.set(createdProduct.id!, createdProduct);
            emit('posted');
            router.push(`/product/${createdProduct.slug}`);
        }
    } catch (err: any) {
        notify({ type: 'error', text: err.data?.message || 'Failed to post product.' });
    } finally {
        isUploading.value = false;
    }
};

const addNewCategory = async (categoryData: { name: string; thumbnailCatUrl: string }) => {
    const newCategory = await categoryStore.addCategory(categoryData);
    if (newCategory) {
        selectedCategory.value = newCategory;
        refresh();
        showCategoryDialog.value = false;
    }
};
</script>
