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
            class="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-w-lg w-full z-50" 
            role="dialog" 
            aria-modal="true"
        >
            <div @click.stop class="bg-white dark:bg-neutral-900 w-full max-h-[85vh] sm:rounded-lg shadow-xl flex flex-col">
                <!-- Modal Header -->
                <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-neutral-800 shrink-0">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-neutral-100">Create New Post</h3>
                    <button @click="$emit('close')" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
                        <Icon name="mdi:close" size="20" class="text-gray-600 dark:text-neutral-300" />
                    </button>
                </div>
                
                <!-- Scrollable Content Area -->
                <div class="flex-1 overflow-y-auto p-6 space-y-4">
                    <!-- Step 1: Media Upload -->
                    <div v-if="!uploadedMedia">
                        <label class="form-label">Upload your Photo or Video</label>
                        <UploadWidget :allow-multiple="false" :alt-text="'your-post'" @upload-complete="handleUpload" @upload-start="isPosting = true" @upload-error="handleUploadError" />
                    </div>

                    <!-- Step 2: Add Details -->
                    <div v-else class="space-y-4">
                        <img :src="getMediaThumbnailUrl(uploadedMedia)" class="w-full h-64 object-cover rounded-lg" />
                        
                        <div>
                            <label class="form-label">Write a caption...</label>
                            <textarea v-model="caption" rows="3" class="form-input" placeholder="What's this post about?"></textarea>
                        </div>
                        
                        <div>
                            <label class="form-label">Tag the product you bought (optional)</label>
                            <TextInput v-model:input="productSearchQuery" @input="debouncedSearch" placeholder="Search for a product..." />
                            <div v-if="searchResults.length" class="border dark:border-neutral-700 rounded-lg max-h-32 overflow-y-auto mt-1">
                                <ul>
                                    <li v-for="product in searchResults" :key="product.id" @click="tagProduct(product)" class="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer text-sm">
                                        {{ product.title }}
                                    </li>
                                </ul>
                            </div>
                            <div v-if="taggedProduct" class="mt-2 p-2 bg-gray-100 dark:bg-neutral-800 rounded-md text-sm font-medium flex items-center justify-between">
                                <span>Tagged: {{ taggedProduct.title }}</span>
                                <button @click="taggedProduct = null"><Icon name="mdi:close" size="16" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Action -->
                <div v-if="uploadedMedia" class="p-4 border-t border-gray-200 dark:border-neutral-800 shrink-0">
                    <button @click="submitPost" :disabled="isPosting" class="w-full py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand-light disabled:opacity-50">
                        {{ isPosting ? 'Posting...' : 'Post' }}
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useApiService } from '~/services/api/apiService';
import { useDebounceFn } from '@vueuse/core';
import type { IMedia, IProduct } from '~/models';
import { getMediaThumbnailUrl } from '~/utils/formatters';
import { notify } from '@kyvg/vue3-notification';
import UploadWidget from '~/components/upload/UploadWidget.vue';
import TextInput from '~/components/shared/TextInput.vue';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close', 'posted']);

const apiService = useApiService();

const uploadedMedia = ref<IMedia | null>(null);
const caption = ref('');
const productSearchQuery = ref('');
const searchResults = ref<Partial<IProduct>[]>([]);
const taggedProduct = ref<Partial<IProduct> | null>(null);
const isPosting = ref(false);

const handleUpload = (media: IMedia) => {
    uploadedMedia.value = media;
    isPosting.value = false; // Upload is done, now waiting for details
};
const handleUploadError = (error: string) => {
    isPosting.value = false;
    notify({ type: 'error', text: error || 'Upload failed.' });
};

const debouncedSearch = useDebounceFn(async () => {
    if (productSearchQuery.value.length < 2) {
        searchResults.value = [];
        return;
    }
    // We need a new API to search ALL products
    searchResults.value = await apiService.searchProducts(productSearchQuery.value);
}, 300);

const tagProduct = (product: Partial<IProduct>) => {
    taggedProduct.value = product;
    productSearchQuery.value = '';
    searchResults.value = [];
};

const submitPost = async () => {
    if (!uploadedMedia.value) {
        notify({ type: 'error', text: 'Please upload media for your post.' });
        return;
    }
    isPosting.value = true;
    try {
        // We need a new API to create a post
        console.log('Post created successfully!', uploadedMedia.value, caption.value, taggedProduct.value);
        await apiService.createPost({
            media: uploadedMedia.value,
            caption: caption.value,
            taggedProductIds: taggedProduct.value ? [taggedProduct.value.id!] : []
        });
        
        notify({ type: 'success', text: 'Post created successfully!' });
        emit('posted');
    } catch (error: any) {
        notify({ type: 'error', text: error.data?.message || 'Failed to create post.' });
    } finally {
        isPosting.value = false;
        emit('close');
    }
};
</script>

<style scoped>
.form-label { @apply block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1; }
.form-input { @apply block w-full border border-gray-300 dark:border-neutral-700 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100; }
</style>
