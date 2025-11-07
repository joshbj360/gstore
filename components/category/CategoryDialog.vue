<template>
  <transition
    enter-active-class="transition-opacity duration-300 ease-out"
    leave-active-class="transition-opacity duration-300 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @click="closeDialog" role="dialog" aria-modal="true">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md" @click.stop>
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">Add New Category</h3>
          <button @click="closeDialog" class="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors">
            <Icon name="mdi:close" size="24" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <TextInput
            v-model:input="name"
            label="Category Name"
            placeholder="e.g., Dresses, Abayas"
            :error="errors.name"
            required
          />

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Category Thumbnail
            </label>
            <div class="flex items-center gap-4">
              <UploadWidget
                :allow-multiple="false"
                :alt-text="name"
                @upload-start="isUploadingThumbnail = true"
                @upload-complete="handleThumbnailUpload"
                @upload-error="handleUploadError"
                class="flex-1"
              />
              <div class="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                <div v-if="isUploadingThumbnail" class="text-gray-400">
                    <Icon name="eos-icons:loading" size="24" />
                </div>
                <img
                  v-else-if="thumbnailCatUrl"
                  :src="thumbnailCatUrl"
                  alt="Category thumbnail"
                  class="w-full h-full object-cover"
                />
                <Icon
                  v-else
                  name="mdi:image-outline"
                  class="w-8 h-8 text-gray-400"
                />
              </div>
            </div>
            <p v-if="errors.thumbnailCatUrl" class="mt-1 text-sm text-red-600">
              {{ errors.thumbnailCatUrl }}
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="closeDialog"
              class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isLoading || !name || !thumbnailCatUrl"
            >
                <span v-if="isLoading">Saving...</span>
                <span v-else>Add Category</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { IMedia } from '~/models';
import TextInput from '../shared/TextInput.vue';
import UploadWidget from '~/components/upload/UploadWidget.vue';

const props = defineProps<{
  isOpen: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits(['submit', 'close']);

const name = ref('');
const thumbnailCatUrl = ref('');
const isUploadingThumbnail = ref(false);
const errors = ref({
  name: '',
  thumbnailCatUrl: ''
});

const handleThumbnailUpload = (media: IMedia) => {
  if (media && media.url) {
    thumbnailCatUrl.value = media.url;
    errors.value.thumbnailCatUrl = '';
  }
  isUploadingThumbnail.value = false;
};

const handleUploadError = (errorMessage: string) => {
    errors.value.thumbnailCatUrl = errorMessage || 'Upload failed. Please try again.';
    isUploadingThumbnail.value = false;
};

const handleSubmit = () => {
  let isValid = true;
  errors.value = { name: '', thumbnailCatUrl: '' }; // Clear previous errors

  if (!name.value.trim()) {
    errors.value.name = 'Category name is required';
    isValid = false;
  }
  if (!thumbnailCatUrl.value) {
    errors.value.thumbnailCatUrl = 'A thumbnail image is required';
    isValid = false;
  }
  if (!isValid) return;

  emit('submit', {
    name: name.value.trim(),
    thumbnailCatUrl: thumbnailCatUrl.value
  });
};

const closeDialog = () => {
  emit('close');
};
</script>

