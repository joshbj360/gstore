<template>
  <div class="text-gray-900 dark:text-neutral-100">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">Earnings & Payouts</h2>
        <p class="text-sm text-gray-600 dark:text-neutral-400 mt-1">View your balance and manage your withdrawals.</p>
      </div>
      <button 
        @click="isPayoutModalOpen = true" 
        :disabled="!wallet || wallet.balance <= 0"
        class="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Request Payout
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-green-50 border border-green-200 dark:bg-green-900/50 dark:border-green-800 rounded-lg p-6">
        <h3 class="text-sm font-medium text-green-700 dark:text-green-300">Available Balance</h3>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{{ formatPrice(wallet?.balance || 0) }}</p>
       </div>
      <div class="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/50 dark:border-yellow-800 rounded-lg p-6">
        <h3 class="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending Balance</h3>
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{{ formatPrice(wallet?.pending_balance || 0) }}</p>
      </div>
    </div>

    <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200 mb-4">Recent Transactions</h3>
        <div class="bg-white dark:bg-neutral-950 rounded-lg shadow-md border border-gray-200 dark:border-neutral-800">
            <div v-if="!wallet?.transactions || wallet.transactions.length === 0" class="text-center p-8 text-gray-500 dark:text-neutral-500">
                <p>No transactions found.</p>
            </div>
            <ul v-else class="divide-y divide-gray-200 dark:divide-neutral-800">
                <li v-for="tx in wallet.transactions" :key="tx.id" class="p-4 flex justify-between items-center">
                    <div>
                        <p class="font-medium text-gray-900 dark:text-neutral-100 capitalize">{{ tx.type.replace('_', ' ') }}</p>
                        <p class="text-xs text-gray-600 dark:text-neutral-400">{{ tx.description }}</p>
                     </div>
                    <div>
                        <p class="font-semibold text-right" :class="tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-brand-light dark:text-brand-light'">
                            {{ formatPrice(tx.amount) }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-neutral-500 text-right">{{ new Date(tx.created_at).toLocaleDateString() }}</p>
                    </div>
                 </li>
            </ul>
        </div>
    </div>

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
import PayoutModal from '~/components/sellers/dashboard/PayoutModal.vue';
import { useApiService } from '~/services/api/apiService';
import { notify } from '@kyvg/vue3-notification';
import { formatPrice } from '~/utils/formatters';
import type { IWallet } from '~/models';

const props = defineProps<{
    wallet: IWallet | null;
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
</script>