<template>
    <div class="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md" @click.stop>
            <div class="p-4 border-b flex justify-between items-center">
                <h2 class="text-lg font-semibold">Request Payout</h2>
                <button @click="$emit('close')" class="p-2 rounded-full hover:bg-gray-100">
                    <Icon name="mdi:close" size="24" />
                </button>
            </div>

            <form @submit.prevent="submitRequest" class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Payout Amount</label>
                    <p class="text-xs text-gray-500 mb-1">Available: {{ formatPrice(availableBalance) }}</p>
                    <CurrencyInput v-model:input="amount" :max="availableBalance" required />
                    <p v-if="error" class="text-brand text-sm mt-1">{{ error }}</p>
                </div>

                <div>
                    <h3 class="text-base font-medium text-gray-800 mb-2">Bank Account Details</h3>
                    <div class="space-y-3">
                        <!-- In a real app, you would fetch saved bank accounts or use a bank selection component -->
                        <TextInput v-model:input="bankDetails.accountNumber" label="Account Number" required />
                        <TextInput v-model:input="bankDetails.bankName" label="Bank Name" required />
                        <TextInput v-model:input="bankDetails.accountName" label="Account Name" required />
                    </div>
                </div>

                <div class="pt-4 flex justify-end gap-3">
                    <button @click="$emit('close')" type="button" class="px-4 py-2 border rounded-lg text-sm font-semibold">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold">Submit Request</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '~/components/shared/TextInput.vue';
import CurrencyInput from '~/components/shared/CurrencyInput.vue';

const props = defineProps<{
    availableBalance: number;
}>();

const emit = defineEmits(['close', 'request-payout']);

const amount = ref(0);
const bankDetails = ref({
    accountNumber: '',
    bankName: '',
    accountName: ''
});
const error = ref('');

const submitRequest = () => {
    error.value = '';
    if (amount.value > props.availableBalance) {
        error.value = 'Amount cannot exceed your available balance.';
        return;
    }
    if (amount.value <= 10000) { // e.g., ₦100 minimum
        error.value = 'Minimum payout amount is ₦100.';
        return;
    }
    // Simple validation for bank details
    if (!bankDetails.value.accountNumber || !bankDetails.value.bankName || !bankDetails.value.accountName) {
        error.value = 'Please complete all bank detail fields.';
        return;
    }

    emit('request-payout', { amount: amount.value, bankDetails: bankDetails.value });
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price / 100);
};
</script>
