<template>
  <div class="text-gray-900 dark:text-neutral-100">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">Analytics</h2>
      <p class="text-sm text-gray-600 dark:text-neutral-400 mt-1">Your sales performance at a glance.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="stats-card bg-white dark:bg-neutral-900">
        <Icon name="mdi:cash-multiple" size="28" class="text-green-500" />
        <h3 class="text-sm font-medium text-gray-500 dark:text-neutral-400 mt-2">Total Sales</h3>
        <p class="text-3xl font-bold text-gray-800 dark:text-neutral-100 mt-1">{{ formatPrice(totalSales) }}</p>
      </div>
      <div class="stats-card bg-white dark:bg-neutral-900">
        <Icon name="mdi:package-variant-closed" size="28" class="text-blue-500" />
        <h3 class="text-sm font-medium text-gray-500 dark:text-neutral-400 mt-2">Total Orders</h3>
        <p class="text-3xl font-bold text-gray-800 dark:text-neutral-100 mt-1">{{ totalOrders }}</p>
      </div>
      <div class="stats-card bg-white dark:bg-neutral-900">
        <Icon name="mdi:receipt-text-arrow-right-outline" size="28" class="text-indigo-500" />
        <h3 class="text-sm font-medium text-gray-500 dark:text-neutral-400 mt-2">Avg. Order Value</h3>
        <p class="text-3xl font-bold text-gray-800 dark:text-neutral-100 mt-1">{{ formatPrice(avgOrderValue) }}</p>
      </div>
    </div>

    <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200 mb-4">Sales This Week</h3>
        <div class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 h-80">
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
// THE FIX: Import nuxt-charts and useColorMode

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps<{
    orders: IOrders[];
}>();

// THE FIX: Get the current color mode
const colorMode = useColorMode();

// --- Computed Stats ---
const completedOrders = computed(() => 
    props.orders.filter(order => 
    order.status === 'COMPLETED' || order.status === 'SHIPPED')
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
                 backgroundColor: '#C42B78', // Using your brand color
                borderRadius: 4,
            }
        ]
    };
});

// THE FIX: chartOptions is now a computed property
const chartOptions = computed(() => {
  // Define colors for light and dark modes
  const isDark = colorMode.value === 'dark';
  const tickColor = isDark ? '#a3a3a3' : '#4b5563'; // neutral-400 (dark) vs gray-600 (light)
  const gridColor = isDark ? '#404040' : '#e5e7eb'; // neutral-700 (dark) vs gray-200 (light)

  return {
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
            ticks: { color: tickColor },
            grid: { color: gridColor }
        },
        y: {
            ticks: { color: tickColor },
            grid: { color: gridColor }
        }
    }
  };
});
</script>

<style scoped>
.stats-card {
    /* THE FIX: Use @apply for theme-aware base styles */
    @apply border border-gray-200 dark:border-neutral-800 rounded-lg p-6;
}
</style>