<template>
  <div class="text-neutral-100">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-neutral-100">Analytics</h2>
      <p class="text-sm text-neutral-400 mt-1">Your sales performance at a glance.</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="stats-card bg-neutral-900">
        <Icon name="mdi:cash-multiple" size="28" class="text-green-400" />
        <h3 class="text-sm font-medium text-neutral-400 mt-2">Total Sales</h3>
        <p class="text-3xl font-bold text-neutral-100 mt-1">{{ formatPrice(totalSales) }}</p>
      </div>
      <div class="stats-card bg-neutral-900">
        <Icon name="mdi:package-variant-closed" size="28" class="text-blue-400" />
        <h3 class="text-sm font-medium text-neutral-400 mt-2">Total Orders</h3>
        <p class="text-3xl font-bold text-neutral-100 mt-1">{{ totalOrders }}</p>
      </div>
      <div class="stats-card bg-neutral-900">
        <Icon name="mdi:receipt-text-arrow-right-outline" size="28" class="text-indigo-400" />
        <h3 class="text-sm font-medium text-neutral-400 mt-2">Avg. Order Value</h3>
        <p class="text-3xl font-bold text-neutral-100 mt-1">{{ formatPrice(avgOrderValue) }}</p>
      </div>
    </div>

    <!-- Sales Chart -->
    <div>
        <h3 class="text-lg font-semibold text-neutral-200 mb-4">Sales This Week</h3>
        <div class="bg-neutral-900 border border-neutral-800 rounded-lg p-4 h-80">
            <Bar :data="chartData" :options="chartOptions" />
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { formatPrice } from '~/utils/formatters';
import type { IOrders } from '~/models';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps<{
    orders: IOrders[];
}>();

// --- Computed Stats ---
const completedOrders = computed(() => 
    props.orders.filter(order => order.status === 'COMPLETED' || order.status === 'SHIPPED')
);

const totalSales = computed(() => 
    completedOrders.value.reduce((sum, order) => sum + order.totalAmount, 0)
);

const totalOrders = computed(() => completedOrders.value.length);

const avgOrderValue = computed(() => 
    totalOrders.value > 0 ? totalSales.value / totalOrders.value : 0
);

// --- Chart.js Data & Options ---
const chartData = computed(() => {
    // Helper to get an array of the last 7 days as strings (e.g., "Oct 20")
    const days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    const salesByDay = days.map(day => {
        return completedOrders.value
            .filter(order => new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === day)
            .reduce((sum, order) => sum + order.totalAmount / 100, 0); // Convert from kobo
    });

    return {
        labels: days,
        datasets: [
            {
                label: 'Sales (₦)',
                data: salesByDay,
                backgroundColor: '#f02c56',
                borderRadius: 4,
            }
        ]
    };
});

const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (context: any) => `₦${context.formattedValue}`
            }
        }
    },
    scales: {
        x: {
            ticks: { color: '#a3a3a3' }, // neutral-400
            grid: { color: '#404040' } // neutral-700
        },
        y: {
            ticks: { color: '#a3a3a3' },
            grid: { color: '#404040' }
        }
    }
});
</script>

<style scoped>
.stats-card {
    @apply border border-neutral-800 rounded-lg p-6;
}
</style>
