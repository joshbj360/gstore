<template>
    <div class="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md" @click.stop>
            <div class="p-4 border-b flex justify-between items-center">
                <h2 class="text-lg font-semibold">Ship Order #{{ order.id }}</h2>
                <button @click="$emit('close')" class="p-2 rounded-full hover:bg-gray-100">
                    <Icon name="mdi:close" size="24" />
                </button>
            </div>

            <form @submit.prevent="submitShipment" class="p-6 space-y-4">
                <div>
                    <p class="text-sm text-gray-600 mb-4">Enter the tracking information provided by your courier to notify the customer.</p>
                    <TextInput v-model:input="trackingNumber" label="Tracking Number" placeholder="e.g., 1234567890" required />
                </div>
                <div>
                    <TextInput v-model:input="shipper" label="Shipping Provider / Courier" placeholder="e.g., GIG Logistics, DHL" required />
                </div>
                
                <div class="pt-4 flex justify-end gap-3">
                    <button @click="$emit('close')" type="button" class="px-4 py-2 border rounded-lg text-sm font-semibold">Cancel</button>
                    <button type="submit" :disabled="isLoading" class="px-4 py-2 bg-[#f02c56] text-white rounded-lg text-sm font-semibold disabled:opacity-70">
                        <span v-if="isLoading">Confirming...</span>
                        <span v-else>Confirm Shipment</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '~/components/shared/TextInput.vue';
import { useOrderStore } from '~/stores';
import type { IOrders } from '~/models';

const props = defineProps<{
    order: IOrders;
}>();

const emit = defineEmits(['close', 'shipped']);

const orderStore = useOrderStore();
const trackingNumber = ref('');
const shipper = ref('');
const isLoading = ref(false);

const submitShipment = async () => {
    if (!trackingNumber.value || !shipper.value) {
        alert('Please fill in both the tracking number and the shipper.');
        return;
    }

    isLoading.value = true;
    const success = await orderStore.markOrderAsShipped(props.order.id, trackingNumber.value, shipper.value);
    isLoading.value = false;

    if (success) {
        emit('shipped'); // Tell the parent component that the operation was successful
        emit('close');
    }
};
</script>
