<template>
  <!-- 
    THE FIX: Component is now theme-compliant. 
    It defaults to light mode and uses dark: prefixes.
  -->
  <div class="text-gray-900 dark:text-neutral-100">
    <!-- Section Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">Manage Orders</h2>
        <p class="text-sm text-gray-600 dark:text-neutral-400 mt-1">View and fulfill your customer orders.</p>
      </div>
      <!-- You can add other controls here, like an "Export" button -->
    </div>

    <!-- Tab Navigation -->
    <nav class="flex border-b border-gray-200 dark:border-neutral-700 mb-6">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" class="px-4 py-3 text-sm font-medium flex items-center whitespace-nowrap"
        :class="[
          activeTab === tab.id
            ? 'text-brand border-b-2 border-brand'
            : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-100 hover:border-b-2 hover:border-gray-300 dark:hover:border-neutral-500'
        ]">
        {{ tab.label }}
        <span class="ml-2 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-200 px-1.5 py-0.5 rounded-full">{{ getCount(tab.id) }}</span>
      </button>
    </nav>

    <!-- Orders Table -->
    <div class="bg-white dark:bg-neutral-950 rounded-lg shadow-md border border-gray-200 dark:border-neutral-800 overflow-x-auto">
      <div v-if="visibleOrders.length === 0" class="text-center p-12 text-gray-500 dark:text-neutral-500">
        <Icon name="mdi:package-variant-closed-remove" size="48" class="mx-auto mb-4" />
        <p>You have no {{ activeTab.toLowerCase() }} orders.</p>
      </div>
      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
        <thead class="bg-gray-50 dark:bg-neutral-800">
          <tr>
            <th scope="col" class="table-header"></th>
            <th scope="col" class="table-header">Order ID</th>
            <th scope="col" class="table-header">Date</th>
            <th scope="col" class="table-header">Buyer</th>
            <th scope="col" class="table-header text-right">Total (₦)</th>
            <th scope="col" class="table-header">Status</th>
            <th scope="col" class="table-header text-right">Your Payout (₦)</th>
            <th scope="col" class="table-header text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-neutral-800">
          <template v-for="order in visibleOrders" :key="order.id">
            <tr class="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
              <td class="px-4 py-4 whitespace-nowrap">
                <button @click="toggleRow(order.id)" class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700">
                  <Icon :name="expandedRows.includes(order.id) ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="20" />
                </button>
              </td>
              <td class="table-cell font-medium text-gray-900 dark:text-neutral-100">#{{ order.id }}</td>
              <td class="table-cell">{{ new Date(order.created_at).toLocaleDateString() }}</td>
              <td class="table-cell">{{ order.user?.username || 'N/A' }}</td>
              <td class="table-cell text-right font-medium">{{ formatPrice(order.totalAmount) }}</td>
              <td class="table-cell">
                <span class="status-badge" :class="getStatusClass(order.status)">{{ order.status }}</span>
              </td>
              <td class="table-cell text-right font-semibold text-green-600 dark:text-green-400">{{ formatPrice(order.payoutAmount || 0) }}</td>
              <td class="table-cell text-center">
                <button 
                  v-if="order.status === EOrderStatus.PAID" 
                  class="action-button bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                  @click="openShipModal(order)"
                >Ship</button>
                <span v-if="order.status === EOrderStatus.SHIPPED" class="text-xs text-gray-400 dark:text-neutral-500">Shipped</span>
                <button v-if="order.status !== EOrderStatus.CANCELED && order.status !== EOrderStatus.SHIPPED" class="action-button text-brand-light text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 ml-2">Cancel</button>
              </td>
            </tr>
            <!-- Expanded Row -->
            <tr v-if="expandedRows.includes(order.id)">
              <td colspan="8" class="p-4 bg-gray-50 dark:bg-neutral-800/30">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 class="font-semibold mb-1">Items ({{ order.orderItem.length }})</h4>
                    <p class="text-gray-600 dark:text-neutral-300">{{ order.orderItem.map(item => `${item.variant.product?.title} (${item.variant.size}) x${item.quantity}`).join(', ') }}</p>
                  </div>
                  <div>
                    <h4 class="font-semibold mb-1">Delivery Address</h4>
                    <p class="text-gray-600 dark:text-neutral-300">{{ order.address }}, {{ order.county }}</p>
                  </div>
                  <div>
                    <h4 class="font-semibold mb-1">Tracking</h4>
                    <p v-if="order.trackingNumber" class="text-gray-600 dark:text-neutral-300">{{ order.shipper }}: {{ order.trackingNumber }}</p>
                    <p v-else class="text-gray-500 dark:text-neutral-500">Not yet shipped.</p>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    
    <!-- Ship Order Modal -->
    <ShipOrderModal 
      v-if="selectedOrderForShipping"
      :order="selectedOrderForShipping"
      @close="selectedOrderForShipping = null"
      @shipped="$emit('order-updated')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { EOrderStatus, type IOrders } from '~/models'; // Using IOrder to match your store
import { formatPrice } from '~/utils/formatters';
import ShipOrderModal from '~/components/shipping/ShipOrderModal.vue';

const props = defineProps<{
    orders: IOrders[];
}>();
const emit = defineEmits(['order-updated']);

const expandedRows = ref<number[]>([]);
const selectedOrderForShipping = ref<IOrders | null>(null);

// State for the new tabbed interface
const activeTab = ref<EOrderStatus | 'ALL'>(EOrderStatus.PAID);
const tabs: Array<{ id: EOrderStatus | 'ALL'; label: string }> = [
  { id: EOrderStatus.PAID, label: 'Ready to Ship' },
  { id: EOrderStatus.SHIPPED, label: 'Shipped' },
  { id: EOrderStatus.PENDING, label: 'Pending' }, // ADDED
  { id: EOrderStatus.CANCELED, label: 'Canceled' },
  { id: 'ALL', label: 'All Orders' },
];

// Computed properties to filter orders based on the active tab
const paidOrders = computed(() => props.orders.filter(o => o.status === EOrderStatus.PAID));
const shippedOrders = computed(() => props.orders.filter(o => o.status === EOrderStatus.SHIPPED));
const pendingOrders = computed(() => props.orders.filter(o => o.status === EOrderStatus.PENDING)); // ADDED
const canceledOrders = computed(() => props.orders.filter(o => o.status === EOrderStatus.CANCELED));

const visibleOrders = computed(() => {
  switch (activeTab.value) {
    case EOrderStatus.PAID: return paidOrders.value;
    case EOrderStatus.SHIPPED: return shippedOrders.value;
    case EOrderStatus.PENDING: return pendingOrders.value; // ADDED
    case EOrderStatus.CANCELED: return canceledOrders.value;
    case 'ALL': return props.orders;
    default: return [];
  }
});

const getCount = (status: EOrderStatus | 'ALL') => {
  switch (status) {
    case EOrderStatus.PAID: return paidOrders.value.length;
    case EOrderStatus.SHIPPED: return shippedOrders.value.length;
    case EOrderStatus.PENDING: return pendingOrders.value.length; // ADDED
    case EOrderStatus.CANCELED: return canceledOrders.value.length;
    case 'ALL': return props.orders.length;
    default: return 0;
  }
};

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
    // THE FIX: Added theme-compliant light mode classes
    if (status === EOrderStatus.PAID) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    if (status === EOrderStatus.SHIPPED) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    if (status === EOrderStatus.PENDING) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    if (status === EOrderStatus.CANCELED) return 'text-brand-light text-red-800 dark:bg-red-900/50 dark:text-red-300';
    return 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-300';
};
</script>

<style scoped>
.table-header {
    @apply px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider;
}
.table-cell {
    @apply px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-neutral-300;
}
.status-badge {
    @apply px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full;
}
.action-button {
    @apply px-3 py-1 text-xs font-medium rounded-full transition-colors;
}
</style>

