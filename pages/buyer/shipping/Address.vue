<template>
    <div class="min-h-screen bg-gray-50">
        <header class="sticky top-0 z-10 bg-white shadow-sm">
            <div class="max-w-2xl mx-auto px-4 py-4 flex items-center">
                <button @click="router.push('/buyer/shipping/checkout')" class="flex items-center text-gray-700 hover:text-[#f02c56] transition-colors">
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
                    <!-- Contact Name -->
                    <TextInput v-model:input="form.name" label="Full Name" placeholder="e.g., Jane Doe" :error="errors.name" required />

                    <!-- Street Address -->
                    <TextInput v-model:input="form.address" label="Street Address" placeholder="e.g., 123 Allen Avenue" :error="errors.address" required />

                    <!-- Country -->
                     <div>
                        <label class="form-label">Country</label>
                        <select v-model="form.country" class="form-input bg-gray-100">
                            <option>Nigeria</option> <!--ADD OTHER COUNTRY HERE!-->
                        </select>
                    </div>

                    <!-- State & LGA -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label class="form-label">State</label>
                            <select v-model="form.state" class="form-input" required>
                                <option disabled value="">Select a state</option>
                                <option v-for="state in nigerianStates" :key="state" :value="state">{{ state }}</option>
                            </select>
                             <p v-if="errors.state" class="form-error">{{ errors.state }}</p>
                        </div>
                        <div>
                            <label class="form-label">Local Government Area (LGA)</label>
                            <select v-model="form.county" :disabled="!form.state" class="form-input" required>
                                <option disabled value="">Select an LGA</option>
                                <option v-for="lga in availableLGAs" :key="lga" :value="lga">{{ lga }}</option>
                            </select>
                            <p v-if="errors.county" class="form-error">{{ errors.county }}</p>
                        </div>
                    </div>

                    <!-- Phone Number -->
                    <TextInput v-model:input="form.phone" label="Phone Number" placeholder="e.g., +2348012345678" type="tel" :error="errors.phone" required />

                    <!-- Submit Button -->
                    <button :disabled="isWorking" type="submit" class="mt-6 w-full bg-[#f02c56] text-white text-base font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[#d81b36] shadow-md hover:shadow-lg">
                        <Icon v-if="isWorking" name="eos-icons:loading" size="20" class="mr-2 animate-spin" />
                        <span>{{ isUpdate ? 'Update Address' : 'Save Address' }}</span>
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '~/stores';
import { useShippingStore } from '~/stores/shipping.store';
import TextInput from '~/components/shared/TextInput.vue';
import type { ShippingAddressInterface } from '~/models/interface/shipping/address.interface';
import { statesAndLGAs, nigerianStates } from '~/utils/nigeria-states';
import { notify } from '@kyvg/vue3-notification';

const shippingStore = useShippingStore();
const userStore = useUserStore();
const router = useRouter();

const form = ref<Partial<ShippingAddressInterface>>({
  name: '',
  address: '',
  country: 'Nigeria',
  state: '',
  county: '',
  phone: '',
  city: '',
  zipCode: ''
});
const isWorking = ref(false);
const isUpdate = ref(false);
const errors = ref<Partial<ShippingAddressInterface>>({});

const availableLGAs = computed(() => {
    return form.value.state ? statesAndLGAs[form.value.state as keyof typeof statesAndLGAs] : [];
});

watch(() => form.value.state, () => {
    // Reset LGA when state changes
    form.value.county = ''; // SAME AS LGA
});

onMounted(async () => {
    if (!userStore.isLoggedIn) {
        return router.push('/auth/login');
    }
    isWorking.value = true;
    await shippingStore.fetchAddress(userStore.user!.id);
    if (shippingStore.address?.address) { // Check for a real address
        form.value = { ...shippingStore.address };
        isUpdate.value = true;
    }
    isWorking.value = false;
});

const validateForm = () => {
  errors.value = {};
  if (!form.value.name?.trim()) errors.value.name = 'Full name is required';
  if (!form.value.address?.trim()) errors.value.address = 'Street address is required';
  if (!form.value.state?.trim()) errors.value.state = 'State is required';
  if (!form.value.county?.trim()) errors.value.county = 'LGA/county is required';
  if (!form.value.country?.trim()) errors.value.country = 'Country is required';
  if (!form.value.phone?.trim()) errors.value.phone = 'Phone number is required';
  return Object.keys(errors.value).length === 0;
};

const submit = async () => {
  if (!validateForm()) return;

  isWorking.value = true;
  try {
    const addressData: ShippingAddressInterface = {
        userId: userStore.user!.id,
        ...form.value,
        created_at: new Date,
        updated_at: new Date
    };

    if (isUpdate.value && shippingStore.address?.id) {
      await shippingStore.updateAddress(addressData);
    } else {
      await shippingStore.addAddress(addressData)
    }
    
    shippingStore.setAddress(form.value as ShippingAddressInterface);
    notify({ type: 'success', text: 'Address saved successfully!' });
    router.push('/shipping/checkout');

  } catch (error) {
    notify({ type: 'error', text: 'Failed to save address. Please try again.' });
  } finally {
    isWorking.value = false;
  }
};
</script>

<style>
.form-label {
    @apply block text-sm font-medium text-gray-700 mb-1;
}
.form-input {
    @apply block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent transition-colors;
}
.form-error {
    @apply text-red-500 text-xs mt-1;
}
</style>