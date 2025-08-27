<template>
  <header class="sticky top-0 z-10 bg-white shadow-sm">
    <div class="container mx-auto px-4 py-4 flex items-center">
      <button
        @click="navigateTOCheckout"
        class="flex items-center text-gray-700 hover:text-[#C42B78] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50 focus:ring-offset-2"
      >
        <Icon name="mdi:arrow-left" size="24" class="mr-2" />
        <span class="font-medium">Back to Checkout</span>
      </button>
    </div>
  </header>
    <div id="AddressPage" class="mt-4 max-w-[500px] mx-auto px-2">
      <div class="bg-white rounded-lg p-3 shadow-sm">
        <h2 class="text-xl font-bold mb-4">Address Details</h2>
        <form @submit.prevent="submit" aria-label="Address form">
          <TextInput
            class="w-full"
            placeholder="Contact Name"
            v-model="form.name"
            input-type="text"
            :error="errors.name"
          />
          <TextInput
            class="w-full mt-2"
            placeholder="Address"
            v-model="form.address"
            input-type="text"
            :error="errors.address"
          />
          <TextInput
            class="w-full mt-2"
            placeholder="Local Government Area"
            v-model="form.localGovernmentArea"
            input-type="text"
            :error="errors.localGovernmentArea"
          />
          <TextInput
            class="w-full mt-2"
            placeholder="State"
            v-model="form.state"
            input-type="text"
            :error="errors.state"
          />
          <TextInput
            class="w-full mt-2"
            placeholder="Phone Number"
            v-model="form.phoneNumber"
            input-type="tel"
            :error="errors.phoneNumber"
          />
          <TextInput
            class="w-full mt-2"
            placeholder="Postal Code"
            v-model="form.postalCode"
            input-type="text"
            :error="errors.postalCode"
          />
          <TextInput
            class="w-full mt-2"
            placeholder="Country"
            v-model="form.country"
            input-type="text"
            :error="errors.country"
          />
          <TextInput
            class="w-full mt-2"
            placeholder="Email (Optional)"
            v-model="form.email"
            input-type="email"
            :error="errors.email"
          />
          <TextInput
            class="w-full mt-2"
            placeholder="City"
            v-model="form.city"
            input-type="text"
            :error="errors.city"
          />
          <button
            :disabled="isWorking"
            type="submit"
            class="mt-6 w-full bg-gradient-to-r from-[#FE630C] to-[#FF3200] text-white text-[21px] font-semibold py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-[#FE630C]/50 focus:ring-offset-2"
            aria-label="Submit address"
          >
            <Icon v-if="isWorking" name="eos-icons:loading" size="25" class="mr-2 animate-spin" />
            <span>{{ isUpdate ? 'Update Address' : 'Add Address' }}</span>
          </button>
          <p v-if="apiError" class="text-red-600 text-sm mt-2 text-center">{{ apiError }}</p>
        </form>
      </div>
    </div>

</template>

<script setup lang="ts">
import TextInput from '~/components/shared/TextInput.vue';
import { useShippingStore } from '~/stores/shipping.store';
import { useSupabaseUser } from '#imports';
import { useRouter } from 'vue-router';
import { ref, watch } from 'vue';
import type { ShippingAddressInterface } from '~/models/interface/shipping/address.interface';

const shippingStore = useShippingStore();
const user = useSupabaseUser();
const router = useRouter();

const form = ref<ShippingAddressInterface>({
  name: '',
  address: '',
  localGovernmentArea: '',
  state: '',
  phoneNumber: '',
  postalCode: '',
  country: '',
  email: '',
  city: '',
});
const isWorking = ref(false);
const isUpdate = ref(false);
const apiError = ref<string | null>(null);
const errors = ref<{
  name: string;
  address: string;
  localGovernmentArea: string;
  state: string;
  phoneNumber: string;
  postalCode: string;
  country: string;
  email: string;
  city: string;
}>({
  name: '',
  address: '',
  localGovernmentArea: '',
  state: '',
  phoneNumber: '',
  postalCode: '',
  country: '',
  email: '',
  city: '',
});

// Fetch address on mount
watch(
  () => user.value?.id,
  async (newId) => {
    if (newId) {
      isWorking.value = true;
      await shippingStore.fetchAddress(newId);
      if (shippingStore.address) {
        form.value = { ...shippingStore.address };
        isUpdate.value = true;
      }
      isWorking.value = false;
    }
  },
  { immediate: true }
);

// Validate form
const validateForm = () => {
  errors.value = {
    name: !form.value.name.trim() ? 'A contact name is required' : '',
    address: !form.value.address.trim() ? 'An address is required' : '',
    state: !form.value.state.trim() ? 'A state is required' : '',
    phoneNumber: !form.value.phoneNumber.trim() ? 'A phone number is required' : '',
    country: !form.value.country.trim() ? 'A country is required' : '',
    city: !form.value.city.trim() ? 'A city is required' : '',
    localGovernmentArea: '',
    postalCode: '',
    email: '',
  };
  return !Object.values(errors.value).some((error) => error);
};

// Submit form
const submit = async () => {
  apiError.value = null;
  if (!validateForm()) {
    return;
  }

  isWorking.value = true;
  try {
    const addressData: ShippingAddressInterface = {
      name: form.value.name.trim(),
      address: form.value.address.trim(),
      localGovernmentArea: form.value.localGovernmentArea?.trim() || undefined,
      state: form.value.state.trim(),
      phoneNumber: form.value.phoneNumber.trim(),
      postalCode: form.value.postalCode?.trim() || undefined,
      country: form.value.country.trim(),
      email: form.value.email?.trim() || undefined,
      city: form.value.city.trim(),
    };

    if (isUpdate.value && shippingStore.address?.id) {
      await useFetch(`/api/prisma/update-address/${shippingStore.address.id}`, {
        method: 'PATCH',
        body: {
          userId: user.value?.id,
          ...addressData,
        },
      });
    } else {
      await useFetch(`/api/prisma/add-address/`, {
        method: 'POST',
        body: {
          userId: user.value?.id,
          ...addressData,
        },
      });
    }

    shippingStore.setAddress(addressData);
    router.push('/checkout');
  } catch (error) {
    apiError.value = 'Failed to save address. Please try again.';
    console.error(error);
  } finally {
    isWorking.value = false;
  }
};
const navigateTOCheckout = () => {
  router.push('/shipping/checkout');
};
</script>

<style scoped>
button:disabled {
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>