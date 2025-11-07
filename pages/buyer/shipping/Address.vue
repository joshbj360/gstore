<template>
    <div>
        <AddressSkeleton v-if="pending" />
        <div v-else-if="error" class="text-center py-20">
            <h2 class="text-xl font-semibold text-brand">Could Not Load Address</h2>
            <p class="text-gray-500 mt-2">{{ error.message }}</p>
        </div>

        <div v-else class="min-h-screen bg-gray-50">
            <header class="sticky top-0 z-10 bg-white shadow-sm">
                <div class="max-w-2xl mx-auto px-4 py-4 flex items-center">
                    <button @click="router.push('/buyer/shipping/checkout')" class="flex items-center text-gray-700 hover:text-brand transition-colors">
                        <Icon name="mdi:arrow-left" size="22" class="mr-2" />
                        <span class="font-medium text-sm">Back to Checkout</span>
                    </button>
                </div>
            </header>

            <div id="AddressPage" class="mt-8 max-w-2xl mx-auto px-4">
                <div class="bg-white rounded-xl shadow-md p-6 sm:p-8">
                    <h2 class="text-2xl font-bold mb-1">Shipping Address</h2>
                    <p class="text-gray-500 mb-6 text-sm">Where should we deliver your order?</p>
                    
                    <form @submit.prevent="submit" class="space-y-6">
                        <TextInput v-model:input="form.name" label="Full Name" placeholder="e.g., Jane Doe" :error="errors.name" required />
                        <TextInput v-model:input="form.address" label="Street Address" placeholder="e.g., 123 Allen Avenue" :error="errors.address" required />

                        <!-- DYNAMIC LOCATION FIELDS -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label class="form-label">Country</label>
                                <select v-model="form.country" class="form-input">
                                    <option v-for="country in countries" :key="country.isoCode" :value="country.name">{{ country.name }}</option>
                                </select>
                            </div>
                            
                            <!-- If Nigeria is selected, show the State dropdown -->
                            <div v-if="form.country === 'Nigeria'">
                                <label class="form-label">State</label>
                                <select v-model="form.state" class="form-input" required>
                                    <option disabled value="">Select a state</option>
                                    <option v-for="(state, index) in allStateNames" :key="index" :value="state">{{ state }}</option>
                                </select>
                                <p v-if="errors.state" class="form-error">{{ errors.state }}</p>
                            </div>
                            <!-- For other countries, show a text input for Province/State -->
                            <div v-else>
                                <TextInput v-model:input="form.state" label="State / Province" :error="errors.state" required />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <!-- If Nigeria is selected, show the LGA dropdown -->
                            <div v-if="form.country === 'Nigeria'">
                                <label class="form-label">Local Government Area (LGA)</label>
                                <select v-model="form.county" :disabled="!form.state" class="form-input" required>
                                    <option disabled value="">Select an LGA</option>
                                    <option v-for="lga in availableLGAs" :key="lga" :value="lga">{{ lga }}</option>
                                </select>
                                <p v-if="errors.county" class="form-error">{{ errors.county }}</p>
                            </div>
                             <!-- For other countries, show a text input for City -->
                            <div v-else>
                                <TextInput v-model:input="form.state" label="City or State" :error="errors.state" required />
                            </div>

                            <TextInput v-model:input="form.zipcode" label="Postal Code" :error="errors.zipcode" />
                        </div>

                        <TextInput v-model:input="form.phone" label="Phone Number" placeholder="e.g., 08012345678" type="tel" :error="errors.phone" required />

                        <button :disabled="isWorking" type="submit" class="mt-6 w-full bg-brand text-white text-base font-semibold py-3 rounded-lg disabled:opacity-50 transition-all hover:bg-brand-light shadow-md">
                            <Icon v-if="isWorking" name="eos-icons:loading" size="20" class="mr-2 animate-spin" />
                            <span>{{ isUpdate ? 'Update Address' : 'Save Address' }}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore, useShippingStore } from '~/stores';
import TextInput from '~/components/shared/TextInput.vue';
import AddressSkeleton from '~/components/skeletons/AddressSkeleton.vue';
import type { IAddress } from '~/models';
// Import our new location utilities
import { getLGAsOfState, allStateNames, getAllCountries } from '@/utils/location-data';
import { notify } from '@kyvg/vue3-notification';

const shippingStore = useShippingStore();
const userStore = useUserStore();
const router = useRouter();

const form = ref<Partial<IAddress>>({ country: 'Nigeria' });
const isUpdate = ref(false);
const errors = ref<Partial<IAddress>>({});
const isWorking = ref(false);
const countries = getAllCountries();

const { data: existingAddress, pending, error } = await useAsyncData('shipping-address', async () => {
    if (!userStore.isLoggedIn) {
        if (import.meta.server) await navigateTo('/auth/login');
        return null;
    }
    return shippingStore.fetchAddress();
});

if (existingAddress.value) {
    form.value = { ...existingAddress.value };
    isUpdate.value = true;
}

const availableLGAs = computed(() => {
    return form.value.state ? getLGAsOfState(form.value.state) : [];
});

watch(() => form.value.country, () => {
    // Reset state/lga when country changes
    form.value.state = '';
    form.value.county = '';
});

watch(() => form.value.state, () => {
    if(form.value.country === 'Nigeria') form.value.county = '';
});

const validateForm = () => {
  errors.value = {};
  if (!form.value.name?.trim()) errors.value.name = 'Full name is required';
  if (!form.value.address?.trim()) errors.value.address = 'Street address is required';
  if (!form.value.state?.trim()) errors.value.state = 'State/Province is required';
  if (form.value.county === 'Nigeria' && !form.value.county?.trim()) errors.value.county = 'LGA is required';
  if (form.value.country !== 'Nigeria' && !form.value.state?.trim()) errors.value.state = 'State is required';
  if (!form.value.phone?.trim()) errors.value.phone = 'Phone number is required';
  return Object.keys(errors.value).length === 0;
};

const submit = async () => {
  if (!validateForm()) return;
  isWorking.value = true;
  try {
    const addressData = { userId: userStore.user!.id, ...form.value };

    if (isUpdate.value ) {
      await shippingStore.saveAddress(addressData as IAddress);
    }
    
    notify({ type: 'success', text: 'Address saved successfully!' });
    router.push('/buyer/shipping/checkout');

  } catch (error) {
    notify({ type: 'error', text: 'Failed to save address. Please try again.' });
  } finally {
    isWorking.value = false;
  }
};
</script>

<style>
.form-label { @apply block text-sm font-medium text-gray-700 mb-1; }
.form-input { @apply block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent; }
.form-error { @apply text-brand text-xs mt-1; }
</style>

