<template>
  <div>
    <!-- 
            THE FIX: The drop zone is now a simple div.
            The `ref="dropZoneRef"` connects it to the VueUse composable.
        -->
    <div ref="dropZoneRef" class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
      :class="isOverDropZone ? 'border-brand bg-brand/10' : 'hover:bg-gray-50'" @click="open">
      <div class="space-y-2">
        <Icon name="mdi:cloud-upload-outline" size="48" class="mx-auto text-gray-400" />
        <p class="text-sm text-gray-600">
          <span class="font-semibold text-brand">Click to upload</span> or drag and drop
        </p>
        <p class="text-xs text-gray-500">Images or video (Max 100MB)</p>
      </div>
    </div>

    <!-- Hidden file input that the composable will trigger -->
    <input ref="fileInput" type="file" :multiple="allowMultiple" @change="onFileChange" class="hidden" />

    <!-- Upload Progress Section -->
    <div v-if="uploadingFiles.length > 0" class="mt-4 space-y-2">
      <div v-for="file in uploadingFiles" :key="file.id" class="p-2 border rounded-lg flex items-center gap-3">
        <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
          <Icon v-if="file.type?.startsWith('image')" name="mdi:image" size="24" class="text-gray-500" />
          <Icon v-else name="mdi:movie" size="24" class="text-gray-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ file.name }}</p>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span>{{ ((file.size || 0) / 1024 / 1024).toFixed(2) }} MB</span>
            <span v-if="file.error" class="text-brand font-semibold">{{ file.error }}</span>
          </div>
        </div>
        <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden" v-if="file.progress > 0 && file.progress < 100">
          <div class="h-full bg-green-500" :style="{ width: file.progress + '%' }"></div>
        </div>
        <Icon v-if="file.success" name="mdi:check-circle" size="20" class="text-green-500" />
        <Icon v-if="file.error" name="mdi:alert-circle" size="20" class="text-brand" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useDropZone } from '@vueuse/core'; // THE FIX: Import the composable
import { useApiService } from '~/services/api/apiService';
import { useRuntimeConfig } from '#app';
import type { EMediaType, IMedia } from '~/models';
import { v4 as uuidv4 } from 'uuid';

const props = defineProps<{
  allowMultiple: boolean,
  altText: string

}>()

const emit = defineEmits(['upload-start', 'upload-complete', 'upload-error']);

const apiService = useApiService();
const config = useRuntimeConfig();

// State for files being processed
const uploadingFiles = ref<any[]>([]);
const uploadedMedia = ref<IMedia[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

// --- VueUse `useDropZone` Implementation ---
const dropZoneRef = ref<HTMLDivElement>();
const { isOverDropZone } = useDropZone(dropZoneRef, { onDrop });

function open() {
  fileInput.value?.click();
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    processFiles(Array.from(target.files));
  }
}

function onDrop(files: File[] | null) {
  if (files) {
    processFiles(files);
  }
}
// --- End of VueUse Implementation ---

const processFiles = (filesToProcess: File[]) => {
  emit('upload-start');
  for (const file of filesToProcess) {
    const fileState = reactive({
      id: uuidv4(),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      success: false,
      error: null as string | null,
    });

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      fileState.error = 'File size exceeds 100MB'
    } else {
      uploadFile(fileState);
    }
    uploadingFiles.value.push(fileState);
  }
};

const uploadFile = (fileState: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      // const { signature, timestamp } = await apiService.getCloudinarySignature();
      const formData = new FormData();
      formData.append('file', fileState.file);
      formData.append('upload_preset', config.public.cloudinaryUploadPreset as string)

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${config.public.cloudName}/auto/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          fileState.progress = parseInt(((e.loaded / e.total) * 100).toFixed(2));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          const newMedia: IMedia = {
            id: data.asset_id,
            name: data.original_filename,
            url: data.secure_url,
            public_id: data.public_id,
            type: data.resource_type.toUpperCase() as EMediaType,
            error: data.error,
            success: data.secure_url ? true : false,
            metadata: {
              width: data.width,
              height: data.height,
            },
            sellerId: '',
            created_at: new Date(data.created_at),
            productId: null,
            altText: props.altText || data.original_filename,
          };

          if (props.allowMultiple) {
            uploadedMedia.value.push(newMedia);
            emit('upload-complete', uploadedMedia.value);
          } else {
            emit('upload-complete', newMedia);
          }

          fileState.success = true;
          resolve(fileState);
        } else {
          const errorMsg = JSON.parse(xhr.responseText)?.error?.message || 'Upload failed';
          fileState.error = errorMsg;
          emit('upload-error', errorMsg);
          reject(fileState);
        }
      };
      xhr.onerror = () => {
        fileState.error = 'Network error';
        emit('upload-error', 'Network error during upload.');
        reject(fileState);
      };
      xhr.send(formData);
    } catch (error: any) {
      const errorMsg = error.data?.message || 'Failed to prepare upload.';
      fileState.error = errorMsg;
      emit('upload-error', errorMsg);
      reject(fileState);
    }
  });
};
</script>
