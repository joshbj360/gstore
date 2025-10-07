<template>
    <div>
        <!-- Section Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Manage Orders</h2>
                <p class="text-sm text-gray-500">View and fulfill your customer orders.</p>
            </div>
        </div>

        <!-- Orders Table -->
        <div class="bg-white rounded-lg shadow-sm border overflow-x-auto">
            <div v-if="orders.length === 0" class="text-center p-12 text-gray-500">
                <Icon name="mdi:package-variant-closed-remove" size="48" class="mx-auto mb-4" />
                <p>You have no orders yet.</p>
            </div>
            <table v-else class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="table-header"></th>
                        <th scope="col" class="table-header">Order ID</th>
                        <th scope="col" class="table-header">Date</th>
                        <th scope="col" class="table-header">Buyer</th>
                        <th scope="col" class="table-header">Total (₦)</th>
                        <th scope="col" class="table-header">Status</th>
                        <th scope="col" class="table-header">Your Payout (₦)</th>
                        <th scope="col" class="table-header text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <template v-for="order in orders" :key="order.id">
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-4 whitespace-nowrap">
                                <button @click="toggleRow(order.id)" class="p-1 rounded-full hover:bg-gray-200">
                                    <Icon :name="expandedRows.includes(order.id) ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="20" />
                                </button>
                            </td>
                            <td class="table-cell font-medium text-gray-900">#{{ order.id }}</td>
                            <td class="table-cell">{{ new Date(order.created_at).toLocaleDateString() }}</td>
                            <td class="table-cell">{{ order.user?.username || 'N/A' }}</td>
                            <td class="table-cell  font-medium">{{ formatPrice(order.totalAmount) }}</td>
                            <td class="table-cell">
                                <span class="status-badge" :class="getStatusClass(order.status)">{{ order.status }}</span>
                            </td>
                            <td class="table-cell  font-semibold text-green-600">{{ formatPrice(order.payoutAmount || 0) }}</td>
                            <td class="table-cell text-center">
                                <button 
                                    v-if="order.status === EOrderStatus.PAID" 
                                    class="action-button bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    @click="openShipModal(order)"
                                >Ship</button>
                                <span v-if="order.status === EOrderStatus.SHIPPED" class="text-xs text-gray-400">Shipped</span>
                                <button v-if="order.status !== EOrderStatus.CANCELED" class="action-button bg-red-100 text-red-700 hover:bg-red-200 ml-2">Cancel</button>
                            </td>
                        </tr>
                        <!-- Expanded Row -->
                        <tr v-if="expandedRows.includes(order.id)">
                            <td colspan="8" class="p-4 bg-gray-50">
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <h4 class="font-semibold mb-1">Items ({{ order.orderItem.length }})</h4>
                                        <p class="text-gray-600">{{ order.orderItem.map(item => `${item.variant.product?.title} (${item.variant.size}) x${item.quantity}`).join(', ') }}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-semibold mb-1">Delivery Address</h4>
                                        <p class="text-gray-600">{{ order.address }}, {{ order.county }}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-semibold mb-1">Platform Commission</h4>
                                        <p class="text-gray-600">{{ formatPrice(order.totalAmount * 0.05) }} (5%)</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
        <ShipOrderModal 
            v-if="selectedOrderForShipping"
            :order="selectedOrderForShipping"
            @close="selectedOrderForShipping = null"
            @shipped="$emit('order-updated')"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { EOrderStatus, type IOrders } from '~/models';
import { formatPrice } from '~/utils/formatters';
import ShipOrderModal from '~/components/shipping/ShipOrderModal.vue';

const config = useRuntimeConfig()
const props = defineProps<{
    orders: IOrders[];
}>();
const emit = defineEmits(['order-updated']);

const expandedRows = ref<number[]>([]);
const selectedOrderForShipping = ref<IOrders | null>(null);

const openShipModal = (order: IOrders) => {
    selectedOrderForShipping.value = order;
};
const toggleRow = (orderId: number) => {
    const index = expandedRows.value.indexOf(orderId);
    if (index > -1) {
        expandedRows.value.splice(index, 1);
    } else {
        expandedRows.value.push(orderId);
    }
};



const getStatusClass = (status: string) => {
    if (status === EOrderStatus.PAID) return 'bg-green-100 text-green-800';
    if (status === EOrderStatus.SHIPPED) return 'bg-blue-100 text-blue-800';
    if (status === EOrderStatus.PENDING) return 'bg-yellow-100 text-yellow-800';
    if (status === EOrderStatus.CANCELED) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
};

const calculatePayout = (order: IOrders) => {
    // This is a simplified calculation. A real implementation would be more robust.
    const commission: number = Number(config.platformCommissionRate)
    return order.totalAmount * (1 - commission);
};
</script>

<style scoped>
.table-header {
    @apply px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}
.table-cell {
    @apply px-4 py-4 whitespace-nowrap text-sm text-gray-600;
}
.status-badge {
    @apply px-2 inline-flex text-xs leading-5 font-semibold rounded-full;
}
.action-button {
    @apply px-3 py-1 text-xs font-medium rounded-full transition-colors;
}
</style>
