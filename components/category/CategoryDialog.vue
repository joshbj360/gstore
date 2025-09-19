<template>
  <dialog
    open
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Add New Category</h3>
        <button
          @click="closeDialog"
          class="text-gray-400 hover:text-gray-500"
        >
          <Icon name="mdi:close" size="24" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <TextInput
          v-model:input="name"
          label="Category Name"
          placeholder="e.g., Electronics"
          :error="errors.name"
          required
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Category Thumbnail
          </label>
          <div class="flex items-center gap-4">
            <UploadWidget
              :media-label="'category-thumbnail'"
              :allow-multiple="false"
              @upload-complete="handleThumbnailUpload"
              class="flex-1"
            />
            <div
              class="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="thumbnailCatUrl"
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

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="closeDialog"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-[#df4949]"
            :disabled="!name || !thumbnailCatUrl"
          >
            Add Category
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import type { MediaInterface } from '~/models/interface/products/media.interface';
import TextInput from '../shared/TextInput.vue';
import UploadWidget from '../upload/UploadWidget.vue';

const emit = defineEmits(['submit', 'close']);

const name = ref('');
const thumbnailCatUrl = ref('');
const errors = ref({
  name: '',
  thumbnailCatUrl: ''
});

const handleThumbnailUpload = (media: MediaInterface[]) => {
  if (media.length > 0) {
    thumbnailCatUrl.value = media[0].url;
    errors.value.thumbnailCatUrl = '';
  }
};

const handleSubmit = () => {
  if (!name.value.trim()) {
    errors.value.name = 'Category name is required';
    return;
  }
  if (!thumbnailCatUrl.value) {
    errors.value.thumbnailCatUrl = 'Thumbnail is required';
    return;
  }

  emit('submit', {
    name: name.value.trim(),
    thumbnailCatUrl: thumbnailCatUrl.value
  });
};

const closeDialog = () => {
  emit('close');
  name.value = '';
  thumbnailCatUrl.value = '';
  errors.value = { name: '', thumbnailCatUrl: '' };
};
</script>