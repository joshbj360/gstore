<template>
    <UploadError :errorType="errorType" />
  
    <!-- Loading Spinner -->
    <div v-if="isUploading" class="fixed flex items-center justify-center top-0 left-0 w-full h-screen bg-black z-50 bg-opacity-50">
      <Icon class="animate-spin ml-1" name="mingcute:loading-line" size="100" color="#FFFFFF" />
    </div>
  
    <UploadLayout>
      <div class="w-full mt-[80px] mb-[40px] bg-white shadow-lg rounded-md py-6 md:px-10 px-4">
        <!-- Header -->
        <div>
          <div class="text-[23px] font-semibold">Edit a Product</div>
          <div class="text-gray-400 mt-1">Edit uploaded product</div>
        </div>
  
        <!-- Main Content -->
        <div class="mt-8 md:flex gap-6">
          <!-- Media Upload Section -->
          <div v-if="!fileDisplay" id="cloudinary-section" class="flex-1">
            <div class="bg-[#F8F8F8] p-6 rounded-lg">
              <div class="flex items-center">
                <Icon class="mr-4" size="20" name="mdi:cloud-upload" />
                <div class="flex-1">
                  <div class="text-semibold text-[15px] mb-1.5">Upload Media</div>
                  <div class="text-semibold text-[13px] text-gray-400">
                    Drag and drop images or videos, or click below to upload.
                  </div>
                </div>
              </div>
              <button
                class="w-full mt-4 px-6 py-2.5 text-white text-[15px] bg-[#F02C56] rounded-lg hover:bg-[#df4949] transition"
                @click="openCloudinaryWidget"
              >
                Select Product Media
              </button>
            </div>
          </div>
  
          <!-- Product Details Section -->
          <div class="mt-4 mb-6 w-full">
            <!-- Media Preview Section -->
            <div v-if="mediaData.length" class="mb-6">
              <h3 class="text-lg font-semibold mb-4">Media Preview</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div
                  v-for="(file, index) in mediaData"
                  :key="index"
                  class="relative w-full h-60 rounded-xl overflow-hidden group"
                >
                  <button
                    @click="removeMedia(index)"
                    class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <Icon name="clarity:close-line" size="16" />
                  </button>
                  <img
                    v-if="file.type === 'image'"
                    :src="file.url"
                    class="w-full h-full object-cover z-0 cursor-pointer"
                    @click="setMainDisplay(index)"
                  />
                  <video
                    v-else
                    autoplay
                    loop
                    muted
                    class="w-full h-full object-cover cursor-pointer"
                    :src="file.url"
                    @click="setMainDisplay(index)"
                  />
                </div>
              </div>
            </div>
  
            <!-- Product Form -->
            <EditProduct 
              :mediaData="mediaData" 
              :product="product_"
              :selected-category="product_.category || {} as CategoryInterface"
              @createPost="saveProduct" 
            />
  
            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row-reverse gap-3 mt-8">
              <button
                @click="discard"
                class="px-10 py-2.5 border text-[16px] hover:bg-gray-100 rounded-lg transition"
              >
                Discard
              </button>
              <button
                @click="saveProduct(product_)"
                class="px-10 py-2.5 border text-[16px] text-white bg-[#F02C56] rounded-lg hover:bg-[#df4949] transition"
              >
                Save
              </button>
            </div>
  
            <!-- Error Messages -->
            <div v-if="errors" class="mt-4">
              <div class="text-red-600" v-if="errors && errors.video">
                {{ errors.video[0] }}
              </div>
              <div class="text-red-600" v-if="errors && errors.text">
                {{ errors.text[0] }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UploadLayout>
  </template>
  
  <script setup lang="ts">
  import { useRoute } from '#vue-router'
  import UploadLayout from '~/layouts/UploadLayout.vue';
  import UploadError from '~/components/upload/UploadError.vue';
  import EditProduct from '~/components/upload/ProductForm.vue';
  import { type MediaInterface } from '~/models/interface/products/media.interface';
  import { defaultProduct, type ProductInterface } from '~/models/interface/products/product.interface';
  import { type CategoryInterface } from '~/models/interface/products/category.interface';
  import { useProductStore } from '~/stores/product.store'

  interface Window {
    cloudinary?: any;
  }
  
  const route = useRoute()
  declare var window: Window;
  const productStore = useProductStore()
  const mediaData = ref<MediaInterface[]>([]);
  const cloudinaryUrls = ref<string[]>([]);
  const fileDisplay = ref<string | null>(null);
  const errorType = ref<string | null>(null);
  const errors = ref<Record<string, string[]> | null>(null);
  const isUploading = ref<boolean>(false);
  const product_ = ref<ProductInterface>(defaultProduct);

  const productId = computed(() => route.params.id)

  const getPreviousProductId = async () => {
    if (productId.value) {
      const product = productStore.getProductById(Number(productId.value))
      if (product) {
        console.log(product)
        product_.value = product
        mediaData.value = product.media
        cloudinaryUrls.value = product.media.map((media) => media.url)
      }
    }
  }

  getPreviousProductId()

    // save product post
    const saveProduct = async (product: ProductInterface) => {
    product_.value = product;
    if (product_.value) {
      await useFetch(`/api/prisma/update-product-by-id/${product_.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product_.value),
      });
      console.log(product_.value)
    }
  };

  // Discard all changes
  const discard = () => {
    fileDisplay.value = null;
    mediaData.value = [];
    cloudinaryUrls.value = [];
    product_.value = defaultProduct;
  };
  
  // Remove media from preview
  const removeMedia = (index: number) => {
    mediaData.value.splice(index, 1);
    cloudinaryUrls.value.splice(index, 1);
  
    if (mediaData.value.length > 0) {
      setMainDisplay(0);
    } else {
      fileDisplay.value = null;
    }
  };
  
  // Set main display media
  const setMainDisplay = (index: number) => {
    fileDisplay.value = mediaData.value[index].url || null;
  };
  
  // Open Cloudinary widget
  const openCloudinaryWidget = () => {
    const cloudinaryWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'dcci05bzj',
        uploadPreset: 'ml_default',
        multiple: true,
        maxFiles: 10,
        folder: 'product_images',
        buttonCaption: 'Select product images',
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
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          cloudinaryUrls.value.push(result.info.secure_url);
          const media = {
            url: result.info.secure_url,
            type: result.info.resource_type,
            format: result.info.format,
            caption: '',
          };
          mediaData.value.push(media);
          console.log("media data:", mediaData.value)
        }
      }
    );
    cloudinaryWidget.open();
  };
  
 
  
  // Mount Cloudinary script
  onMounted(() => {
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/latest/global/all.js';
      script.type = 'text/javascript';
      script.async = true;
      document.head.appendChild(script);
    }
  });
  </script>
  
  <style scoped>
  /* Add custom styles as needed */
  </style>