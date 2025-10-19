<template>
    <div class="min-h-screen bg-gray-50">
        <header class="bg-white shadow-sm sticky top-0 z-10">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                <h1 class="text-2xl font-bold text-gray-900">My Orders</h1>
                <p class="text-sm text-gray-500 mt-1">View your order history and track your shipments.</p>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div v-if="pending" class="space-y-4">
                <div v-for="i in 3" :key="i" class="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
            </div>
            <div v-else-if="error" class="text-center py-12">
                <p class="text-brand">Could not load your order history.</p>
            </div>
            <div v-else-if="!orders || orders.length === 0" class="text-center py-16">
                <Icon name="mdi:package-variant-closed" size="48" class="mx-auto text-gray-300 mb-4" />
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                <p class="text-gray-500 mb-6">You haven't placed any orders yet.</p>
                <NuxtLink to="/" class="px-6 py-2 bg-brand text-white font-semibold rounded-lg shadow-md hover:bg-[#d81b36]">
                    Start Shopping
                </NuxtLink>
            </div>

            <div v-else class="space-y-6">
                <div v-for="order in orders" :key="order.id" class="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div class="p-4 bg-gray-50/70 border-b flex justify-between items-center text-sm">
                        <div>
                            <p class="font-semibold">Order #{{ order.id }}</p>
                            <p class="text-xs text-gray-500">Placed on {{ new Date(order.created_at).toLocaleDateString() }}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold">{{ formatPrice(order.totalAmount) }}</p>
                            <span class="status-badge" :class="getStatusClass(order.status)">{{ order.status }}</span>
                        </div>
                    </div>
                    <div class="p-4 space-y-4">
                        <div v-for="item in order.orderItem" :key="item.id" class="flex gap-4">
                            <img :src="item.variant?.product?.media[0]?.url" class="w-16 h-16 rounded-md object-cover">
                            <div class="flex-1 text-sm">
                                <p class="font-medium text-gray-800">{{ item.variant?.product?.title }}</p>
                                <p class="text-gray-500">Size: {{ item.variant.size }} | Qty: {{ item.quantity }}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- THE FIX: This section now displays the tracking information -->
                    <div v-if="order.status === EOrderStatus.SHIPPED && order.trackingNumber" class="p-4 border-t bg-blue-50">
                        <div class="flex items-center">
                             <Icon name="mdi:truck-delivery-outline" size="20" class="text-blue-600 shrink-0" />
                             <div class="ml-3 text-sm">
                                <p class="font-semibold text-blue-800">Shipped with {{ order.shipper }}</p>
                                <a :href="`https://www.google.com/search?q=${order.shipper}+tracking+${order.trackingNumber}`" target="_blank" class="text-blue-600 hover:underline">
                                    Track Package: {{ order.trackingNumber }}
                                </a>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { EOrderStatus, type IOrders } from '~/models';
import { useOrderStore, useUserStore } from '~/stores';
import { formatPrice } from '~/utils/formatters';

const props = defineProps<{
    orders: IOrders[];
    pending: boolean;
    error: any;
}>();

const orderStore = useOrderStore();
const userStore = useUserStore();



const getStatusClass = (status: string) => {
    // Add the SHIPPED status for correct styling
    if (status === EOrderStatus.SHIPPED) return 'bg-blue-100 text-blue-800';
    if (status === EOrderStatus.PAID) return 'bg-green-100 text-green-800';
    if (status === EOrderStatus.PENDING) return 'bg-yellow-100 text-yellow-800';
    if (status === EOrderStatus.CANCELED) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
};
</script>

<style scoped>
.status-badge {
    @apply px-2 inline-flex text-xs leading-5 font-semibold rounded-full mt-1;
}
</style>

