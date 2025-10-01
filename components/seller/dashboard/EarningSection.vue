<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Earnings & Payouts</h2>
        <p class="text-sm text-gray-500">View your balance and manage your withdrawals.</p>
      </div>
      <button 
        @click="isPayoutModalOpen = true" 
        :disabled="!wallet || wallet.balance <= 0"
        class="bg-[#f02c56] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d81b36] disabled:opacity-50"
      >
        Request Payout
      </button>
    </div>

    <!-- Wallet Balance Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 class="text-sm font-medium text-green-800">Available Balance</h3>
        <p class="text-3xl font-bold text-green-700 mt-2">{{ formatPrice(wallet?.balance || 0) }}</p>
      </div>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 class="text-sm font-medium text-yellow-800">Pending Balance</h3>
        <p class="text-3xl font-bold text-yellow-700 mt-2">{{ formatPrice(wallet?.pending_balance || 0) }}</p>
      </div>
    </div>

    <!-- Transaction History -->
    <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>
        <div class="bg-white rounded-lg shadow-sm border">
            <div v-if="!wallet?.transactions || wallet.transactions.length === 0" class="text-center p-8 text-gray-500">
                <p>No transactions found.</p>
            </div>
            <ul v-else class="divide-y divide-gray-200">
                <!-- ... transaction list ... -->
            </ul>
        </div>
    </div>

    <!-- Payout Request Modal -->
    <PayoutModal 
        v-if="isPayoutModalOpen" 
        :available-balance="wallet?.balance || 0"
        @close="isPayoutModalOpen = false"
        @request-payout="handlePayoutRequest"
    />
  </div>
</template>
 
<script setup lang="ts">
import { ref } from 'vue';
import PayoutModal from '@/components/seller/dashboard/PayoutModal.vue';
import { useApiService } from '~/services/api/apiService';
import { notify } from '@kyvg/vue3-notification';

// This component is now "dumb" and receives its data as a prop
const props = defineProps<{
    wallet: any | null;
}>();

const emit = defineEmits(['payout-requested']);

const isPayoutModalOpen = ref(false);
const apiService = useApiService();

const handlePayoutRequest = async (payoutDetails: { amount: number; bankDetails: any }) => {
    try {
        const response = await apiService.requestPayout(payoutDetails);
        notify({ type: 'success', text: response.message });
        emit('payout-requested'); // Tell the parent to refresh its data
    } catch (error: any) {
        notify({ type: 'error', text: error.data?.message || 'Payout request failed.' });
    } finally {
        isPayoutModalOpen.value = false;
    }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price / 100);
};
</script>

