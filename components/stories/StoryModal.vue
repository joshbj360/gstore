<template>
    <div v-if="isOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @click="$emit('close')">
        <div class="bg-white rounded-xl p-6 w-full max-w-md" @click.stop>
            <h3 class="text-lg font-bold mb-4">Upload Your Story</h3>
            
            <div v-if="!uploadedMedia" class="space-y-4">
                <UploadWidget :allow-multiple="false" :alt-text="'your-story'" @upload-complete="handleUpload" />
            </div>

            <div v-else class="space-y-4">
                <p class="text-sm text-gray-500">Link a product to your story (optional):</p>
                <TextInput v-model:input="productSearchQuery" @input="debouncedSearch" placeholder="Search your products..." />
                
                <div v-if="searchResults.length" class="border rounded-lg max-h-32 overflow-y-auto">
                    <ul>
                        <li v-for="product in searchResults" :key="product.id" @click="selectProduct(product)" class="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                            {{ product.title }}
                        </li>
                    </ul>
                </div>
                
                <div v-if="linkedProduct" class="p-2 bg-gray-100 rounded-md text-sm font-medium">
                    Linked: {{ linkedProduct.title }}
                </div>
                
                <div class="flex justify-end gap-3 pt-4">
                    <button @click="$emit('close')" type="button" class="px-4 py-2 border rounded-lg text-sm font-semibold">Cancel</button>
                    <button @click="postStory" :disabled="isPosting" class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold disabled:opacity-70">
                        {{ isPosting ? 'Posting...' : 'Post Story' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useStoryStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useDebounceFn } from '@vueuse/core';
import type { IMedia, IProduct } from '~/models';
import UploadWidget from '~/components/upload/UploadWidget.vue';
import TextInput from '~/components/shared/TextInput.vue';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close', 'posted']);

const apiService = useApiService();
const storyStore = useStoryStore();

const uploadedMedia = ref<IMedia | null>(null);
const productSearchQuery = ref('');
const searchResults = ref<Partial<IProduct>[]>([]);
const linkedProduct = ref<Partial<IProduct> | null>(null);
const isPosting = ref(false);

const handleUpload = (media: IMedia) => {
    uploadedMedia.value = media;
};

const debouncedSearch = useDebounceFn(async () => {
    if (productSearchQuery.value.length < 2) {
        searchResults.value = [];
        return;
    }
    searchResults.value = await apiService.searchProducts(productSearchQuery.value);
}, 300);

const selectProduct = (product: Partial<IProduct>) => {
    linkedProduct.value = product;
    productSearchQuery.value = '';
    searchResults.value = [];
};

const postStory = async () => {
    if (!uploadedMedia.value) return;

    isPosting.value = true;
    try {
        // THE FIX: The body now perfectly matches the Zod schema on the server.
        // It's an object containing a 'media' property and an optional 'productId'.
        const payload = {
            media: {
                url: uploadedMedia.value.url,
                public_id: uploadedMedia.value.public_id,
                type: uploadedMedia.value.type,
                metadata: uploadedMedia.value.metadata || {},
            },
            productId: linkedProduct.value?.id,
        };

        const success = await storyStore.createStory(payload);
        if (success) {
            emit('posted');
        }
    } finally {
        isPosting.value = false;
        emit('close');
    }
};
</script>

