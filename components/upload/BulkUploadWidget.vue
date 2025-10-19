<template>
  <div class="bulk-upload-widget space-y-4">
    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:border-[#f02c56] transition-colors cursor-pointer"
      @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput"
    >
      <input ref="fileInput" type="file" accept=".csv" class="hidden" @change="handleFileChange" />
      <Icon name="mdi:file-document-multiple-outline" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <div v-if="!file" class="text-gray-500">
        <p class="text-lg font-medium">Drop your CSV file here or click to browse</p>
      </div>
      <div v-else class="text-gray-700">
        <p class="font-medium">{{ file.name }}</p>
        <p class="text-sm text-gray-500">{{ records.length }} products found</p>
      </div>
    </div>

    <div v-if="isUploading || uploadComplete" class="p-4 border rounded-lg bg-gray-50">
      <h3 class="font-semibold mb-2">Upload Progress</h3>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div class="bg-brand h-2.5 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
      </div>
      <p class="text-sm text-gray-600 mt-2 text-center">{{ progressMessage }}</p>
      
      <div v-if="statusLog.length > 0" class="mt-4 max-h-40 overflow-y-auto bg-white p-2 rounded border text-xs space-y-1">
        <p v-for="(log, index) in statusLog" :key="index" :class="log.type === 'error' ? 'text-brand' : 'text-gray-700'">
          {{ log.message }}
        </p>
      </div>
    </div>

    <div class="flex justify-between items-center">
      <button @click="downloadTemplate" class="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
        Download Template
      </button>
      <button @click="startUpload" :disabled="isUploading || !file || records.length === 0" class="px-6 py-2 bg-brand text-white rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed">
        {{ isUploading ? 'Uploading...' : 'Start Upload' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Papa from 'papaparse';
import { notify } from "@kyvg/vue3-notification";
import { useRouter } from 'vue-router';
import { useApiService } from '~/services/api/apiService';
import type { IProduct } from '~/models';

interface CsvRecord {
  title: string;
  description: string;
  price: string;
  discount?: string;
  category: string;
  tags?: string;
  media_urls?: string;
  media_types?: string;
  sizes?: string;
  stocks?: string;
}
interface StatusLogEntry {
  message: string;
  type: 'success' | 'error';
}

const emit = defineEmits(['upload-start', 'upload-complete', 'upload-error']);

const fileInput = ref<HTMLInputElement | null>(null);
const file = ref<File | null>(null);
const records = ref<CsvRecord[]>([]);
const isUploading = ref<boolean>(false);
const uploadComplete = ref<boolean>(false);
const progress = ref<number>(0);
const progressMessage = ref<string>('');
const statusLog = ref<StatusLogEntry[]>([]);
const router = useRouter();
const apiService = useApiService();

const triggerFileInput = (): void => fileInput.value?.click();
const handleFileChange = (e: Event): void => { 
  const target = e.target as HTMLInputElement;
    if (target.files) parseFile(target.files[0]);
};
const handleDrop = (e: DragEvent): void => {
  e.preventDefault();
  if (e.dataTransfer?.files) parseFile(e.dataTransfer.files[0]);
};

const parseFile = (csvFile: File): void => {
    if (!csvFile || !csvFile.type.includes('csv')) {
        notify({ type: 'error', text: 'Please select a valid CSV file.' });
        return;
    }
    file.value = csvFile;
    Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<CsvRecord>) => {
            records.value = results.data;
        }
    });
};

const startUpload = async (): Promise<void> => {
    if (records.value.length === 0) return;
    
    emit('upload-start');
    isUploading.value = true;
    uploadComplete.value = false;
    statusLog.value = [];
    progress.value = 0;
    
    const productsToCreate = records.value.map(record => ({
        title: record.title,
        description: record.description,
        price: parseFloat(record.price) * 100,
        discount: record.discount ? parseFloat(record.discount) : null,
        category: record.category,
        tags: record.tags ? record.tags.split(',').map(t => t.trim()) : [],
        media: record.media_urls ? record.media_urls.split('|').map((url, i) => ({ url: url.trim(), type: record.media_types?.split('|')[i]?.trim().toUpperCase() || 'IMAGE' })) : [],
        variants: record.sizes ? record.sizes.split('|').map((size, i) => ({ size: size.trim(), stock: parseInt(record.stocks?.split('|')[i]?.trim() || '0', 10) })) : [],
    }));

    const batchSize = 5; // Send 5 products per API call
    let successfulUploads = 0;

    for (let i = 0; i < productsToCreate.length; i += batchSize) {
        const batch = productsToCreate.slice(i, i + batchSize);
        progressMessage.value = `Uploading products ${i + 1} to ${Math.min(i + batchSize, productsToCreate.length)}...`;

        try {
            const response = await apiService.createBatchProducts(batch);
            successfulUploads += response.createdCount;
            
            if (response.errors.length > 0) {
                response.errors.forEach((e: string) => statusLog.value.push({ message: `❌ ${e}`, type: 'error' }));
            } else {
                 statusLog.value.push({ message: `✅ Batch ${i / batchSize + 1}: Successfully uploaded ${batch.length} products.`, type: 'success' });
            }

        } catch (error: any) {
            statusLog.value.push({ message: `❌ Batch ${i / batchSize + 1}: Failed. ${error.data?.message || 'Server error'}`, type: 'error' });
        }

        progress.value = Math.round(((i + batch.length) / productsToCreate.length) * 100);
    }

    progressMessage.value = `Upload complete! ${successfulUploads} / ${productsToCreate.length} products created.`;
    isUploading.value = false;
    uploadComplete.value = true;
    notify({ type: 'success', text: 'Bulk upload process finished!' });
    setTimeout(() => router.push('/seller/dashboard'), 3000);
};

const downloadTemplate = (): void => {
  const link = document.createElement('a');
  link.href = '/assets/templates/product-upload-template.csv';
  link.download = 'product-upload-template.csv';
  link.click();
};
</script>