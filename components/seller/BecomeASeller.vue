<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 text-center mb-8">Become a Seller</h1>
      <p class="text-center text-gray-600 mb-10">
        Join our platform to start selling your products. Fill out the form below to apply.
      </p>

      <div class="bg-white shadow-md rounded-lg p-6 sm:p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              v-model="formData.name"
              id="name"
              type="text"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#C42B78] focus:border-transparent"
              placeholder="John Doe"
              required
            />
            <span v-if="errors.name" class="text-red-500 text-sm">{{ errors.name }}</span>
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              v-model="formData.email"
              id="email"
              type="email"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#C42B78] focus:border-transparent"
              placeholder="john.doe@example.com"
              required
            />
            <span v-if="errors.email" class="text-red-500 text-sm">{{ errors.email }}</span>
          </div>

          <!-- Store Name -->
          <div>
            <label for="storeName" class="block text-sm font-medium text-gray-700">Store Name</label>
            <input
              v-model="formData.storeName"
              id="storeName"
              type="text"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#C42B78] focus:border-transparent"
              placeholder="My Fashion Hub"
              required
            />
            <span v-if="errors.storeName" class="text-red-500 text-sm">{{ errors.storeName }}</span>
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Store Description</label>
            <textarea
              v-model="formData.description"
              id="description"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#C42B78] focus:border-transparent h-24 resize-none"
              placeholder="Tell us about your store and what you plan to sell..."
              required
            />
            <span v-if="errors.description" class="text-red-500 text-sm">{{ errors.description }}</span>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full py-2 px-4 bg-brand text-white rounded-md hover:bg-[#df4949] transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Submitting...' : 'Apply Now' }}
            </button>
          </div>

          <!-- Success/Error Messages -->
          <div v-if="submissionStatus" class="text-center">
            <p v-if="submissionStatus === 'success'" class="text-green-600">Application submitted successfully! We will review it soon.</p>
            <p v-else-if="submissionStatus === 'error'" class="text-red-500">Something went wrong. Please try again later.</p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const formData = ref({
  name: '',
  email: '',
  storeName: '',
  description: '',
});

const errors = ref({
  name: '',
  email: '',
  storeName: '',
  description: '',
});

const isSubmitting = ref(false);
const submissionStatus = ref<'success' | 'error' | null>(null);

const handleSubmit = async () => {
  isSubmitting.value = true;
  errors.value = {
    name: '',
    email: '',
    storeName: '',
    description: '',
  };

  // Basic client-side validation
  if (!formData.value.name.trim()) errors.value.name = 'Name is required';
  if (!formData.value.email.trim()) errors.value.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) errors.value.email = 'Invalid email format';
  if (!formData.value.storeName.trim()) errors.value.storeName = 'Store name is required';
  if (!formData.value.description.trim()) errors.value.description = 'Description is required';

  if (Object.values(errors.value).some((error) => error)) {
    isSubmitting.value = false;
    return;
  }

  try {
    // Placeholder for API call - replace with actual endpoint
    // Example: await $fetch('/api/seller/apply', { method: 'POST', body: formData.value });
    console.log('Submitting application:', formData.value);

    // Simulate API response delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    submissionStatus.value = 'success';
    setTimeout(() => {
      router.push('/seller/dashboard');
    }, 2000); // Redirect after 2 seconds to show success message
  } catch (error) {
    console.error('Submission error:', error);
    submissionStatus.value = 'error';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* No additional custom CSS needed; all styling is handled by Tailwind */
</style>