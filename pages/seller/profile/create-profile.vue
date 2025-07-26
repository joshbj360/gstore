<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <header class="sticky top-0 z-10 bg-white shadow-sm mb-6">
        <div class="container mx-auto px-4 py-3 flex items-center justify-between">
          <button @click="navigateBack" class="flex items-center text-gray-700 hover:text-[#f02c56] transition-colors">
            <Icon name="mdi:arrow-left" size="24" class="mr-2" />
            <span class="font-medium">Back to Home</span>
          </button>
          <button @click="saveProfile" :disabled="isSaving"
            class="py-2 px-4 bg-[#f02c56] text-white rounded-md hover:bg-[#df4949] transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed">
            {{ isSaving ? 'Creating...' : 'Create Profile' }}
          </button>
        </div>
      </header>

      <div class="bg-white shadow-md rounded-lg p-6 sm:p-8">
        <LoadingSpinner v-if="loading" />
        <div v-else-if="error" class="bg-[#f8f0f0] text-[#f02c56] p-4 rounded-lg">{{ error }}</div>
        <form v-else @submit.prevent="saveProfile" class="space-y-6">
          <!-- Store Banner -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Store Banner</label>
            <div
              class="mt-1 relative w-full h-40 sm:h-60 rounded-xl overflow-hidden border-2 border-gray-200 border-dashed">
              <img v-if="formData.store_banner" :src="formData.store_banner" alt="Store Banner"
                class="w-full h-full object-cover" @error="handleImageError" />
              <div v-else
                class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 cursor-pointer"
                @click="triggerBannerUpload">
                <span>Click to upload or drag banner image</span>
              </div>
              <input ref="bannerInput" type="file" accept="image/*" class="hidden" @change="handleBannerUpload" />
            </div>
            <span v-if="errors.store_banner" class="text-red-500 text-sm">{{ errors.store_banner }}</span>
          </div>

          <!-- Store Logo -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Store Logo</label>
            <div class="mt-1 flex items-center">
              <img :src="formData.store_logo || 'https://picsum.photos/id/1005/200'" alt="Store Logo"
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gray-200 object-cover mr-4"
                @error="handleImageError" />
              <button type="button" @click="triggerLogoUpload"
                class="py-1 px-3 bg-[#f02c56] text-white rounded-md hover:bg-[#df4949] transition-colors text-sm">
                Upload Logo
              </button>
              <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="handleLogoUpload" />
            </div>
            <span v-if="errors.store_logo" class="text-red-500 text-sm">{{ errors.store_logo }}</span>
          </div>

          <!-- Store Name -->
          <div>
            <label for="storeName" class="block text-sm font-medium text-gray-700">Store Name</label>
            <input v-model="formData.store_name" id="storeName" type="text"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent"
              placeholder="My Fashion Hub" required />
            <span v-if="errors.store_name" class="text-red-500 text-sm">{{ errors.store_name }}</span>
          </div>

          <!-- Store Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Store Description</label>
            <textarea v-model="formData.store_description" id="description"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent h-24 resize-none"
              placeholder="Tell us about your store and what you sell..." required />
            <span v-if="errors.store_description" class="text-red-500 text-sm">{{ errors.store_description }}</span>
          </div>

          <!-- Location and Phone -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700">Location</label>
              <input v-model="formData.store_location" id="location" type="text"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent"
                placeholder="Lagos, Nigeria" />
              <span v-if="errors.store_location" class="text-red-500 text-sm">{{ errors.store_location }}</span>
            </div>
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
              <input v-model="formData.store_phone" id="phone" type="tel"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent"
                placeholder="+234 123 456 7890" />
              <span v-if="errors.store_phone" class="text-red-500 text-sm">{{ errors.store_phone }}</span>
            </div>
          </div>

          <!-- Website and Socials -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label for="website" class="block text-sm font-medium text-gray-700">Website</label>
              <input v-model="formData.store_website" id="website" type="url"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent"
                placeholder="https://myfashionhub.com" />
              <span v-if="errors.store_website" class="text-red-500 text-sm">{{ errors.store_website }}</span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Social Media</label>
              <div v-if="formData.store_socials" class="mt-1 space-y-2">
                <div v-for="(url, platform) in formData.store_socials" :key="platform" class="flex items-center">
                  <Icon :name="getSocialIcon(platform)" size="20" class="mr-2 text-gray-500" />
                  <input v-model="formData.store_socials[platform]" :placeholder="`${platform} URL`"
                    class="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent" />
                </div>
              </div>
              <span v-if="errors.store_socials" class="text-red-500 text-sm">{{ errors.store_socials }}</span>
            </div>
          </div>

          <!-- Success/Error Feedback -->
          <div v-if="submissionStatus" class="text-center">
            <p v-if="submissionStatus === 'success'" class="text-green-600">Profile created successfully! Redirecting...
            </p>
            <p v-else-if="submissionStatus === 'error'" class="text-red-500">Failed to create profile. Please try again.
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { notify } from '@kyvg/vue3-notification'
import LoadingSpinner from '@/components/shared/Loading.vue';
import type { SellerStoreInterface } from '@/models/interface/auth/user.interface';

const router = useRouter();
const userStore = useUserStore();

const bannerInput = ref<HTMLInputElement | null>(null);
const logoInput = ref<HTMLInputElement | null>(null);

const formData = ref<SellerStoreInterface>({
  store_name: '',
  store_description: '',
  store_banner: '',
  store_logo: '',
  store_location: '',
  store_phone: '',
  store_website: '',
  store_socials: {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    tiktok: '',
  },
  is_verified: false,
  ratings: { average: 0, count: 0 },
  reviews: [],
  products: [],
});

const errors = ref({
  store_name: '',
  store_description: '',
  store_banner: '',
  store_logo: '',
  store_location: '',
  store_phone: '',
  store_website: '',
  store_socials: '',
});

const loading = ref(false); // No initial fetch needed since this is a new profile
const error = ref<string | null>(null);
const isSaving = ref(false);
const submissionStatus = ref<'success' | 'error' | null>(null);

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = 'https://via.placeholder.com/300';
};

const triggerBannerUpload = () => {
  bannerInput.value?.click();
};

const triggerLogoUpload = () => {
  logoInput.value?.click();
};

const handleBannerUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      formData.value.store_banner = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleLogoUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      formData.value.store_logo = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const getSocialIcon = (platform: string) => {
  const icons: Record<string, string> = {
    facebook: 'mdi:facebook',
    twitter: 'mdi:twitter',
    instagram: 'mdi:instagram',
    youtube: 'mdi:youtube',
    linkedin: 'mdi:linkedin',
    tiktok: 'mdi:tiktok',
    pinterest: 'mdi:pinterest',
  };
  return icons[platform.toLowerCase()] || 'mdi:link';
};

const saveProfile = async () => {
  isSaving.value = true;
  errors.value = {
    store_name: '',
    store_description: '',
    store_banner: '',
    store_logo: '',
    store_location: '',
    store_phone: '',
    store_website: '',
    store_socials: '',
  };

  // Basic validation
  if (!formData.value.store_name?.trim()) errors.value.store_name = 'Store name is required';
  if (!formData.value.store_description.trim()) errors.value.store_description = 'Description is required';
  if (Object.values(errors.value).some((error) => error)) {
    isSaving.value = false;
    return;
  }

  try {
    // Associate with the authenticated user
    const completeProfile = {
      ...formData.value,
      store_name: formData.value.store_name?.replaceAll(' ', '-').toLowerCase(),
      sellerId: userStore.user?.id, // Link to the authenticated user's ID
    };

    // Placeholder for API call - replace with actual endpoint
    // Example: await userStore.createSellerProfile(completeProfile);

    // Simulate API response delay
    if (await userStore.createSellerProfile(completeProfile)) {
      console.log('Creating profile:', completeProfile);
      submissionStatus.value = 'success';
      console.log('Profile created successfully!')
      notify({text: 'Profile created successfully!', type: "success"});
      setTimeout(() => {
        router.push(`/seller/profile/${completeProfile.store_name}`);
      }, 2000); // Redirect after 2 seconds
    }
    //await new Promise((resolve) => setTimeout(resolve, 1000));


  } catch (error) {
    console.error('Create profile error:', error);
    submissionStatus.value = 'error';
    notify({text: 'Failed to create profile. Please try again.', type: "error"});
    console.log('Failed to create profile. Please try again')

  } finally {
    isSaving.value = false;
  }
};

const navigateBack = () => {
  router.push('/');
};

onMounted(() => {
  // No initial fetch needed; form starts empty for new profile
});
</script>

<style scoped>
/* No additional custom CSS needed; all styling is handled by Tailwind */
</style>