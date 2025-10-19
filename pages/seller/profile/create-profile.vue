<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-2xl">
      <div class="bg-white shadow-xl rounded-2xl p-6 sm:p-10">
        <NuxtLink to="/" class="text-center mb-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Become a Seller on Grandeur</h1>
          <p class="text-gray-500 mt-2">Join our community of creators and entrepreneurs.</p>
        </NuxtLink>

        <!-- Progress Bar -->
        <div class="mb-8">
          <div class="relative pt-1">
            <div class="flex mb-2 items-center justify-between">
              <div>
                <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-brand-dark bg-brand/10">
                  Step {{ currentStep }} of 3
                </span>
              </div>
            </div>
            <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-brand/20">
              <div :style="{ width: `${(currentStep / 3) * 100}%` }" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand transition-all duration-500"></div>
            </div>
          </div>
        </div>

        <!-- Step 1: Store Basics -->
        <form @submit.prevent="nextStep" v-if="currentStep === 1" class="space-y-6">
          <div>
            <label for="storeName" class="block text-sm font-medium text-gray-700">Store Name</label>
            <input v-model="formData.store_name" id="storeName" type="text" class="form-input" placeholder="e.g., Grandeur Fashion House" required />
            <p v-if="errors.store_name" class="form-error">{{ errors.store_name }}</p>
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Store Description</label>
            <textarea v-model="formData.store_description" id="description" class="form-input h-28 resize-none" placeholder="Tell your customers about your unique brand and products..." required />
            <p v-if="errors.store_description" class="form-error">{{ errors.store_description }}</p>
          </div>
        </form>

        <!-- Step 2: Branding -->
        <div v-if="currentStep === 2" class="space-y-8">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Store Banner</label>
            <div @click="triggerBannerUpload" class="relative w-full h-48 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
              <img v-if="formData.store_banner" :src="formData.store_banner" alt="Store Banner Preview" class="w-full h-full object-cover rounded-xl" />
              <div v-else class="text-center text-gray-500">
                <Icon name="mdi:image-plus" size="40" />
                <p class="mt-2">Upload a banner (1500x500 recommended)</p>
              </div>
              <input ref="bannerInput" type="file" accept="image/*" class="hidden" @change="handleBannerUpload" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
            <div class="flex items-center gap-4">
              <img :src="formData.store_logo || 'https://picsum.photos/id/1005/200'" alt="Store Logo" class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
              <button type="button" @click="triggerLogoUpload" class="py-2 px-4 bg-brand/10 text-brand-dark rounded-md hover:bg-brand/20 transition-colors text-sm font-semibold">
                Upload Logo
              </button>
              <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="handleLogoUpload" />
            </div>
          </div>
        </div>

        <!-- Step 3: Contact & Socials -->
        <div v-if="currentStep === 3" class="space-y-6">
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700">Location</label>
              <input v-model="formData.store_location" id="location" type="text" class="form-input" placeholder="e.g., Lagos, Nigeria" />
            </div>
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">Public Phone (Optional)</label>
              <input v-model="formData.store_phone" id="phone" type="tel" class="form-input" placeholder="+234 123 456 7890" />
            </div>
             <div>
              <label class="block text-sm font-medium text-gray-700">Social Media (Optional)</label>
              <div v-if="formData.store_socials" class="mt-2 space-y-3">
                <div v-for="(url, platform) in formData.store_socials" :key="platform" class="flex items-center">
                  <Icon :name="getSocialIcon(platform)" size="20" class="mr-3 text-gray-400" />
                  <input v-model="formData.store_socials[platform]" :placeholder="`https://www.${platform}.com/your-store`" class="form-input" />
                </div>
              </div>
            </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="mt-10 flex justify-between items-center">
          <button @click="prevStep" :disabled="currentStep === 1" class="py-2 px-4 text-gray-600 rounded-md hover:bg-gray-100 text-sm font-semibold disabled:opacity-50">
            Back
          </button>
          <button v-if="currentStep < 3" @click="nextStep" class="py-2 px-6 bg-brand text-white rounded-md hover:bg-[#df4949] text-sm font-semibold">
            Next
          </button>
          <button v-if="currentStep === 3" @click="saveProfile" :disabled="isSaving" class="py-2 px-6 bg-brand text-white rounded-md hover:bg-[#df4949] text-sm font-semibold disabled:opacity-50">
            {{ isSaving ? 'Creating...' : 'Finish & Create Store' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { notify } from '@kyvg/vue3-notification';
import type { SellerStoreInterface } from '@/models/interface/auth/user.interface';

const router = useRouter();
const userStore = useUserStore();

// --- AUTHENTICATION CHECK ---
onMounted(() => {
  // If the user is not logged in, redirect them to the login page
  if (!userStore.isLoggedIn) {
    notify({ type: 'warn', text: 'Please log in or create an account to become a seller.' });
    router.push('/auth/login');
  }
});

// --- Multi-Step Form State ---
const currentStep = ref(1);

const nextStep = () => {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < 3) currentStep.value++;
  }
};
const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

// --- Form Data and Handling ---
const bannerInput = ref<HTMLInputElement | null>(null);
const logoInput = ref<HTMLInputElement | null>(null);
const isSaving = ref(false);

const formData = ref<SellerStoreInterface>({
  profileId: '',
  store_name: '',
  store_description: '',
  store_banner: '',
  store_logo: '',
  store_location: '',
  store_phone: '',
  store_socials: {
    instagram: '',
    twitter: '',
    tiktok: '',
  },
});

const errors = ref({
  store_name: '',
  store_description: '',
});

const validateStep = (step: number): boolean => {
    if (step === 1) {
        errors.value.store_name = formData.value.store_name ? '' : 'Store name is required.';
        errors.value.store_description = formData.value.store_description ? '' : 'Store description is required.';
        return !errors.value.store_name && !errors.value.store_description;
    }
    return true; // No validation needed for other steps
};

const handleImageUpload = (e: Event, target: 'logo' | 'banner') => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (target === 'logo') formData.value.store_logo = event.target?.result as string;
      if (target === 'banner') formData.value.store_banner = event.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }
};
const handleBannerUpload = (e: Event) => handleImageUpload(e, 'banner');
const handleLogoUpload = (e: Event) => handleImageUpload(e, 'logo');
const triggerBannerUpload = () => bannerInput.value?.click();
const triggerLogoUpload = () => logoInput.value?.click();

const getSocialIcon = (platform: string) => {
  const icons: Record<string, string> = {
    twitter: 'mdi:twitter',
    instagram: 'mdi:instagram',
    tiktok: 'mdi:tiktok',
  };
  return icons[platform.toLowerCase()] || 'mdi:link';
};

const saveProfile = async () => {
  if (!validateStep(1)) return; // Final validation
  isSaving.value = true;
  try {
    const completeProfile = {
      ...formData.value,
      store_name: formData.value.store_name?.replaceAll(' ', '-').toLowerCase(),
      store_description: formData.value.store_description?.trim(),
      // profileId: formData.value.profileId?.trim(),
    };
    const success = await userStore.createSellerProfile(completeProfile);
    if (success) {
      notify({ type: "success", text: 'Your store has been created successfully!' });
      router.push(`/seller/profile/${completeProfile.store_name}`);
    } else {
        throw new Error(userStore.error || 'Failed to create profile.');
    }
  } catch (error: any) {
    notify({ type: "error", text: error.message || 'An unexpected error occurred.' });
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.form-input {
  @apply mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#C42B78] focus:border-transparent transition-colors;
}
.form-error {
  @apply text-brand text-sm mt-1;
}
</style>