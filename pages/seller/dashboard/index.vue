<template>
  <div>
    
    <DashboardSkeleton v-if="pending" />

    <div v-else-if="error || !dashboardData" class="text-center py-20">
      <h2 class="text-xl font-semibold text-brand">Could Not Load Dashboard</h2>
      <p class="text-gray-600 dark:text-neutral-400 mt-2">{{ error?.data || 'An unexpected error occurred.' }}</p>
      <button @click="refresh()" class="mt-4 text-sm font-semibold text-brand hover:underline">
        Try Again
      </button>
    </div>

    <div v-else class="min-h-screen">
      <header class="sticky top-0 z-10 bg-white dark:bg-neutral-950 shadow-sm border-b border-gray-200 dark:border-neutral-800">
        <div class="container mx-auto px-4 py-3 flex items-center justify-between">
           <button @click="navigateHome" class="flex items-center text-gray-600 dark:text-neutral-300 hover:text-brand transition-colors">
            <Icon name="mdi:arrow-left" size="24" />
            <span class="font-medium text-sm ml-2 hidden sm:inline">Back to Home</span>
          </button>
          <div class="flex items-center space-x-2 sm:space-x-4">
            <button @click="refresh()" class="p-2 rounded-full text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800" aria-label="Refresh Data">
               <Icon name="mdi:refresh" size="20" />
            </button>
            <div v-click-outside="() => showNotificationMenu = false" class="relative">
              <button @click="showNotificationMenu = !showNotificationMenu" class="p-2 rounded-full text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 relative" aria-label="Notifications">
                <Icon name="mdi:bell-outline" size="22" />
                <span v-if="unreadNotifications > 0" class="absolute top-1 right-1 bg-brand text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center border-2 border-white dark:border-neutral-950">
                  {{ unreadNotifications }}
                </span>
              </button>
               <transition
                enter-active-class="transition-all duration-200 ease-out"
                leave-active-class="transition-all duration-200 ease-in"
                enter-from-class="opacity-0 scale-95"
                leave-to-class="opacity-0 scale-95"
               >
                  <div v-if="showNotificationMenu" class="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-md shadow-lg border border-gray-200 dark:border-neutral-700 z-20">
                      <div class="px-4 py-2 border-b border-gray-200 dark:border-neutral-700"><p class="text-sm font-medium text-gray-900 dark:text-neutral-100">Notifications</p></div>
                      <div v-if="notifications.length" class="max-h-80 overflow-y-auto">
                           <a v-for="notification in notifications" :key="notification.id" href="#" class="block px-4 py-3 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800">
                              {{ notification.message }}
                          </a>
                      </div>
                      <p v-else class="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">No new notifications</p>
                  </div>
              </transition>
            </div>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-6">
        <div class="mb-6">
          <div class="flex overflow-x-auto space-x-4 pb-4 no-scrollbar lg:grid lg:grid-cols-4 lg:space-x-0 lg:gap-6">
             <div class="flex-shrink-0 w-3/4 sm:w-1/2 md:w-1/3 lg:w-full" v-for="stat in stats" :key="stat.title">
              <DashboardStat 
                :title="stat.title" 
                :value="stat.value" 
                :icon="stat.icon" 
                 :trend="stat.trend" 
                :change="stat.change"
              />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-neutral-950 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800">
          <nav class="border-b border-gray-200 dark:border-neutral-800">
            <div class="sm:hidden p-3">
              <select v-model="activeSection" class="w-full p-2 border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 rounded-lg text-sm text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50">
                <option v-for="section in sections" :key="section.id" :value="section.id">{{ section.label }}</option>
               </select>
            </div>
            <div class="hidden sm:flex flex-row overflow-x-auto no-scrollbar">
              <button
                v-for="section in sections"
                :key="section.id"
                 @click="activeSection = section.id"
                class="px-4 py-3 text-sm font-medium flex items-center whitespace-nowrap transition-colors"
                :class="{
                  'text-brand border-b-2 border-[#f02c56]': activeSection === section.id,
                   'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-brand hover:bg-gray-100 dark:hover:bg-neutral-800': activeSection !== section.id
                }"
              >
                <Icon :name="section.icon" size="18" class="mr-2" />
                {{ section.label }}
               </button>
            </div>
          </nav>

          <div class="p-4 sm:p-6">
            <ProductsSection v-if="activeSection === 'products'" :products="products" @update="refresh" />
            <OrdersSection v-if="activeSection === 'orders'" :orders="orders" @order-updated="refresh" />
            <EarningsSection v-if="activeSection === 'earnings'" :wallet="wallet" @payout-requested="refresh" />
            <LogisticsSection v-if="activeSection === 'logistics'" :orders="orders" :shippingZoneCount="userStore.sellerProfile?.shippingZones?.length || 0" />
            <AnalyticsSection v-if="activeSection === 'analytics'" :orders="orders" />
            <CustomersSection v-if="activeSection === 'customers'" :customers="customerData" />
            <MessagesSection v-if="activeSection === 'messages'" :unread-count="0" />
            <AdsSection v-if="activeSection === 'ads'" :products="products" />
            <AIEnhancementSection v-if="activeSection === 'ai-enhancement'" :products="products" @update="refresh" />
            <SettingsSection v-if="activeSection === 'settings'" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore, useUserStore, useOrderStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useSupabaseClient } from '#imports';
import { notify } from "@kyvg/vue3-notification";
import { formatNumber, formatPrice } from '~/utils/formatters';
import DashboardSkeleton from '~/components/skeletons/DashboardSkeleton.vue';
// Components
import DashboardStat from '~/components/seller/dashboard/DashboardStat.vue';
import ProductsSection from '~/components/seller/dashboard/ProductsSection.vue';
import AdsSection from '~/components/seller/dashboard/AdsSection.vue';
import SettingsSection from '~/components/seller/dashboard/SettingsSection.vue';
import CustomersSection from '~/components/seller/dashboard/CustomersSection.vue';
import AIEnhancementSection from '~/components/seller/dashboard/AIEnhancementSection.vue';
import MessagesSection from '~/components/seller/dashboard/MessagesSection.vue';
import LogisticsSection from '~/components/seller/dashboard/LogisticsSection.vue';
import OrdersSection from '~/components/seller/dashboard/OrdersSection.vue';
import AnalyticsSection from '~/components/seller/dashboard/AnalyticsSection.vue';
import EarningsSection from '~/components/seller/dashboard/EarningSection.vue';
import type { IProduct, IOrders } from '~/models'; // Import IOrders

const vClickOutside = { /* ... (click outside directive logic) ... */ };

const router = useRouter();
const productStore = useProductStore();
const userStore = useUserStore();
const orderStore = useOrderStore();
const apiService = useApiService();
const supabase = useSupabaseClient();

const activeSection = ref('products');
const showNotificationMenu = ref(false);

const { data: dashboardData, pending, error, refresh } = await useLazyAsyncData('seller-dashboard', async () => {
  if (!userStore.isLoggedIn || !userStore.isSeller) {
    throw createError({ statusCode: 403, message: 'You must be a seller to view this page.' });
  }
  
  await userStore.fetchUserAndProfile();

  const [products, orders, wallet, customers, notifications] = await Promise.all([
    productStore.fetchDashboardProducts(),
    orderStore.fetchSellerOrders(),
    apiService.getSellerWallet(),
    Promise.resolve([]), // Placeholder for customer fetching logic
    apiService.getNotifications()
  ]);

  return { products, orders, wallet, customers, notifications };
});

// --- REAL-TIME SUBSCRIPTION ---
let channel: any = null;
onMounted(() => {
    channel = supabase
        .channel('public:Notification')
        .on('postgres_changes', { 
            event: 'INSERT', 
             schema: 'public', 
            table: 'Notification', 
            filter: `userId=eq.${userStore.user?.id}` 
        }, 
        (payload) => {
            console.log('New notification received!', payload);
            notify({ type: 'success', text: payload.new.message || 'You have a new update!' });
            refresh();
        })
        .subscribe();
});

onUnmounted(() => {
    if (channel) {
        supabase.removeChannel(channel);
    }
});
// --- END OF REAL-TIME LOGIC ---

const products = computed(() => dashboardData.value?.products || []);
const orders = computed(() => dashboardData.value?.orders || []);
const wallet = computed(() => dashboardData.value?.wallet || null);
// const customers = computed(() => dashboardData.value?.customers || []); // We will replace this
const notifications = computed(() => dashboardData.value?.notifications.notifications || []);
const unreadNotifications = computed(() => notifications.value.filter((n: any) => !n.read).length);

// --- THE FIX: NEW COMPUTED PROP FOR CUSTOMER LTV ---
const customerData = computed(() => {
    const customerMap = new Map<string, {
        id: string;
        username: string;
        email: string;
        totalSpent: number;
        orderCount: number;
        lastOrderDate: Date;
    }>();

    // We only care about completed orders for LTV
    const completedOrders = orders.value.filter(
        (o: IOrders) => o.status === 'COMPLETED' || o.status === 'SHIPPED'
    );

    for (const order of completedOrders) {
        if (!order.user) continue; // Skip orders with no user data

        const user = order.user;
        const existing = customerMap.get(user.id);
        const orderAmount = order.payoutAmount || 0; // Use payoutAmount for seller's net

        if (existing) {
            existing.orderCount++;
            existing.totalSpent += orderAmount;
            if (new Date(order.created_at) > existing.lastOrderDate) {
                existing.lastOrderDate = new Date(order.created_at);
            }
        } else {
            customerMap.set(user.id, {
                id: user.id,
                username: user.username || 'N/A',
                email: user.email,
                totalSpent: orderAmount,
                orderCount: 1,
                lastOrderDate: new Date(order.created_at),
            });
        }
    }
    // Return a sorted array, with top spenders first
    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
});
// --- END OF FIX ---

const stats = computed(() => {
    const totalSales = orders.value.reduce((sum, order) => sum + order.totalAmount, 0);
    return [
        { title: "Total Sales", value: formatPrice(totalSales), icon: "mdi:cash-multiple", trend: "up", change: 15.2 },
        { title: "Orders", value: formatNumber(orders.value.length), icon: "mdi:package-variant-closed", trend: "up", change: 8.7 },
        { title: "Products", value: formatNumber(products.value.length), icon: "mdi:shopping", trend: "neutral", change: 0 },
        { title: "Available Payout", value: formatPrice(wallet.value?.balance || 0), icon: "mdi:wallet-outline", trend: "neutral", change: 0 }
    ];
});

const salesData = computed(() => ({}));
const navigateHome = () => router.push('/');

const sections = [
  { id: 'products', label: 'Products', icon: 'mdi:package-variant' },
  { id: 'orders', label: 'Orders', icon: 'mdi:clipboard-list' },
  { id: 'earnings', label: 'Earnings', icon: 'mdi:wallet-outline' },
  { id: 'analytics', label: 'Analytics', icon: 'mdi:chart-line' },
  { id: 'customers', label: 'Customers', icon: 'mdi:account-group' },
  { id: 'messages', label: 'Messages', icon: 'mdi:chat' },
  { id: 'ads', label: 'Ads', icon: 'mdi:advertisements' },
  { id: 'logistics', label: 'Shipping', icon: 'mdi:truck' },
  { id: 'ai-enhancement', label: 'AI Tools', icon: 'mdi:robot-happy-outline' },
  { id: 'settings', label: 'Settings', icon: 'mdi:cog' },
];
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>