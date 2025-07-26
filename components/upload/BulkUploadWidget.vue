<template>
  <div class="bulk-upload-widget">
    <!-- Upload Area -->
  
    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:border-[#f02c56] transition-colors cursor-pointer"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        class="hidden"
        @change="handleFileChange"
      />
      <Icon v-if="!files.length" name="mdi:file-document-multiple-outline" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <div v-if="!files.length" class="text-gray-500">
        <p class="text-lg font-medium">Drop your CSV file here or click to browse</p>
        <p class="text-sm">Maximum file size: 5MB</p>
      </div>
      <div v-else class="text-gray-700">
        <p class="font-medium">{{ files[0].name }} ({{ formatFileSize(files[0].file.size) }})</p>
        <p class="text-sm text-gray-500">Ready to upload</p>
      </div>
    </div>

    <!-- Progress and Actions -->
    <div v-if="isUploading" class="mt-4">
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div
          class="bg-[#f02c56] h-2.5 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <p class="text-sm text-gray-600 mt-2">Uploading: {{ progress }}%</p>
    </div>

    <div class="mt-4 flex justify-between items-center">
      <button
        type="button"
        @click="downloadTemplate"
        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Download our product template
      </button>
      <div class="flex space-x-2">
        <button
          v-if="isUploading"
          type="button"
          @click="cancelUpload"
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="uploadFiles"
          :disabled="isUploading || !files.length"
          class="px-4 py-2 bg-[#f02c56] text-white rounded-md hover:bg-[#df4949] transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ isUploading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="uploadStatus" class="mt-4 text-center">
      <p v-if="uploadStatus === 'success'" class="text-green-600 text-sm">{{ uploadMessage }}</p>
      <p v-else-if="uploadStatus === 'error'" class="text-red-500 text-sm">{{ uploadMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { notify } from '@kyvg/vue3-notification';
import type { ProductInterface } from '~/models/interface';
import type { ProductFileInterface } from '~/models/interface/products/product.interface';

const router = useRouter();

const fileInput = ref<HTMLInputElement | null>(null);
const files = ref<ProductFileInterface[]>([]);
const isUploading = ref(false);
const progress = ref(0);
const uploadStatus = ref<'success' | 'error' | null>(null);
const uploadMessage = ref('');
const errorType = ref<'bulk-upload' | null>(null);

// Props
defineProps<{
  maxFiles?: number; // Maximum number of files (default to 1 for CSV)
}>();

const emit = defineEmits<{
  (e: 'upload-complete', files: ProductFileInterface[]): void;
  (e: 'upload-error', error: string): void;
}>();

// File size formatting
const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// Drag and Drop Handlers
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer?.files) {
    handleFiles(Array.from(e.dataTransfer.files));
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    handleFiles(Array.from(target.files));
  }
};

const handleFiles = (newFiles: File[]) => {
  const validFiles = newFiles
    .filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'))
    .slice(0, 1); // Limit to 1 file for CSV
  if (!validFiles.length) {
    notify({text:'Please upload a valid CSV file', type:"warn" })
    return;
  }
  files.value = validFiles.map(file => ({
    name: file.name,
    format: file.type,
    file,
  }));
  uploadStatus.value = null;
  uploadMessage.value = '';
};

// Template Download
const downloadTemplate = () => {
  const link = document.createElement('a');
  link.href = '/assets/templates/product-upload-template.csv';
  link.download = 'product-upload-template.csv';
  link.click();
};

// Upload Logic
const uploadFiles = async () => {
  if (!files.value.length) return;

  isUploading.value = true;
  progress.value = 0;

  const formData = new FormData();
  formData.append('file', files.value[0].file);

  try {
    const response = await $fetch('/api/prisma/products/bulk-uploads', {
      method: 'POST',
      body: formData,
      onUploadProgress: (progressEvent: { total: number; loaded: number; }) => {
        if (progressEvent.total) {
          progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
      },
    });

    uploadMessage.value = `${response.count} products uploaded successfully`;
    uploadStatus.value = 'success';
    emit('upload-complete', files.value);
    notify({ text: uploadMessage.value, type: "success"});
    setTimeout(() => {
      router.push('/seller/dashboard?bulk_upload=success');
    }, 2000);
  } catch (error) {
    uploadMessage.value =  'Failed to upload products';
    uploadStatus.value = 'error';
    errorType.value = 'bulk-upload';
    emit('upload-error', uploadMessage.value);
    notify({ text: uploadMessage.value,type: "error"})
  } finally {
    isUploading.value = false;
  }
};

const cancelUpload = () => {
  isUploading.value = false;
  // Note: $fetch doesn't support native abort; consider using AbortController with fetch
  files.value = [];
  uploadStatus.value = null;
  uploadMessage.value = '';
};
</script>

<style scoped>
.bulk-upload-widget {
  @apply w-full max-w-2xl mx-auto;
}
</style>