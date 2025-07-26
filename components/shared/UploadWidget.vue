<template>
  <div>
    <button
      class="mt-2 px-6 py-2.5 text-white text-[15px] bg-[#F02C56] rounded-lg hover:bg-[#df4949] transition flex items-center justify-center gap-2"
      @click="openCloudinaryWidget"
      :disabled="isLoading"
    >
      <Icon v-if="isLoading" name="mingcute:loading-line" class="animate-spin" />
      <span>{{ isLoading ? 'Uploading...' : mediaLabel }}</span>
    </button>

    <!-- Error Message -->
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script lang="ts" setup>
import type { MediaInterface, MediaType } from '~/models/interface/products/media.interface';

interface CloudinaryResult {
  event: string;
  info: {
    secure_url: string;
    resource_type: string;
    format: string;
    width?: number;
    height?: number;
    bytes?: number;
  };
}
interface CloudinaryError {
  message: string;
  status: number;
}
interface CloudinaryWidgetOptions {
  cloudName: string;
  uploadPreset: string;
  multiple?: boolean;
  maxFiles?: number;
  folder?: string;
  showAlreadyUploaded: boolean
  buttonCaption?: string;
  styles?: {
    palette: {
      [key: string]: string;
    };
  };
}

const props = defineProps({
    mediaLabel: {
        type: String,
        default: 'Select Media',
    },
    allowMultiple: {
        type: Boolean,
        default: true,
    },
    maxFiles: {
    type: Number,
    default: 10,
    validator: (value: number) => value > 0 && value <= 20,
  },
  folder: {
    type: String,
    default: 'product_media',
  },
  accept: {
    type: String,
    default: 'image/*,video/*',
  },
})

const emit = defineEmits<{
  (e: 'upload-complete', media: MediaInterface[]): void;
  (e: 'upload-error', error: string): void;
}>();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dcci05bzj';
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default';
// const mediaArray: MediaInterface[] = [];

const isLoading = ref(false);
const error = ref<string | null>(null);
const widget = ref<any>(null);

console.log("cloud name:", cloudName) //TODO: remove this line
console.log("upload preset:", uploadPreset) //TODO: remove this line

  interface Window {
    cloudinary?: any;
  }
  declare var window: Window;

  // Open Cloudinary widget
 const openCloudinaryWidget = () => {
  if (isLoading.value) return;

  if (!window.cloudinary) {
    error.value = 'Cloudinary widget is not loaded yet. Please try again.';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    if (!widget.value) {
      initializeWidget();
    }
    widget.value?.open();
  } catch (err) {
    error.value = 'Failed to open upload widget';
    console.error('Widget error:', err);
    isLoading.value = false;
  }
};
const initializeWidget = () => {
  const options: CloudinaryWidgetOptions = {
    cloudName,
    uploadPreset,
    multiple: props.allowMultiple,
    maxFiles: props.maxFiles,
    folder: props.folder,
    buttonCaption: props.mediaLabel,
    showAlreadyUploaded: true,
    styles: {
      palette: {
        window: '#F8F8F8',
        sourceBg: '#FFFFFF',
        windowBorder: '#F02C56',
        tabIcon: '#F02C56',
        inactiveTabIcon: '#555555',
        menuIcons: '#F02C56',
        link: '#F02C56',
        action: '#F02C56',
        inProgress: '#F02C56',
        complete: '#F02C56',
        error: '#FF0000',
        textDark: '#000000',
        textLight: '#FFFFFF',
      },
    },
  };
  widget.value = window.cloudinary.createUploadWidget(
    options,
    (error: CloudinaryError | null, result: CloudinaryResult) => {
      isLoading.value = false;
      
      if (error) {
        handleUploadError(error);
        return;
      }

      if (result && result.event === 'success') {
        handleUploadSuccess(result);
      }
    }
  );
};
const handleUploadSuccess = (result: CloudinaryResult) => {
  const mediaType = result.info.resource_type.toUpperCase() as MediaType;
  
  const media: MediaInterface = {
    url: result.info.secure_url,
    type: mediaType,
    format: result.info.format,
    caption: '',
    dimensions: result.info.width && result.info.height 
      ? { width: result.info.width, height: result.info.height }
      : undefined,
    size: result.info.bytes,
  };

  emit('upload-complete', [media,]);
};
const handleUploadError = (err: CloudinaryError) => {
  error.value = `Upload failed: ${err.message}`;
  emit('upload-error', err.message);
  console.error('Cloudinary upload error:', err);
};

   // Mount Cloudinary script
onMounted(() => {
  if (!window.cloudinary) {
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/latest/global/all.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      initializeWidget();
    };
    script.onerror = () => {
      error.value = 'Failed to load Cloudinary widget';
    };
    document.head.appendChild(script);
  } else {
    initializeWidget();
  }
});

// Clean up widget when component unmounts
onBeforeUnmount(() => {
  if (widget.value) {
    widget.value.close();
    widget.value.destroy();
  }
});
</script>
