<template>
  <div>
    <!-- The Skeleton Loader is shown while the initial data is pending -->
    <DashboardSkeleton v-if="pending" />

    <!-- The Error state is shown if the fetch fails -->
    <div v-else-if="error || !dashboardData" class="text-center py-20">
      <h2 class="text-xl font-semibold text-red-500">Could Not Load Dashboard</h2>
      <p class="text-gray-500 mt-2">{{ error?.data || 'An unexpected error occurred.' }}</p>
      <button @click="refresh" class="mt-4 text-sm font-semibold text-[#f02c56] hover:underline">
        Try Again
      </button>
    </div>

    <!-- The real content is only rendered AFTER data has successfully arrived -->
    <div v-else class="min-h-screen bg-gray-50">
      <header class="sticky top-0 z-10 bg-white shadow-sm">
        <div class="container mx-auto px-4 py-3 flex items-center justify-between">
          <button @click="navigateHome" class="flex items-center text-gray-700 hover:text-[#f02c56] transition-colors">
            <Icon name="mdi:arrow-left" size="24" />
            <span class="font-medium text-sm ml-2 hidden sm:inline">Back to Home</span>
          </button>
          <div class="flex items-center space-x-2 sm:space-x-4">
            <button @click="refresh" class="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label="Refresh Data">
              <Icon name="mdi:refresh" size="20" />
            </button>
            <div v-click-outside="() => showNotificationMenu = false" class="relative">
              <button @click="showNotificationMenu = !showNotificationMenu" class="p-2 rounded-full hover:bg-gray-100 text-gray-600 relative" aria-label="Notifications">
                <Icon name="mdi:bell-outline" size="22" />
                <span v-if="unreadNotifications > 0" class="absolute top-1 right-1 bg-[#f02c56] text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                  {{ unreadNotifications }}
                </span>
              </button>
              <transition
                enter-active-class="transition-all duration-200 ease-out"
                leave-active-class="transition-all duration-200 ease-in"
                enter-from-class="opacity-0 scale-95"
                leave-to-class="opacity-0 scale-95"
              >
                  <div v-if="showNotificationMenu" class="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg border z-20">
                      <div class="px-4 py-2 border-b"><p class="text-sm font-medium">Notifications</p></div>
                      <div v-if="notifications.length" class="max-h-80 overflow-y-auto">
                          <a v-for="notification in notifications" :key="notification.id" href="#" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">
                              {{ notification.message }}
                          </a>
                      </div>
                      <p v-else class="px-4 py-3 text-sm text-gray-500">No new notifications</p>
                  </div>
              </transition>
            </div>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-6">
        <!-- Horizontally Scrollable Quick Stats for Mobile -->
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

        <!-- Dashboard Content -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <nav class="border-b border-gray-200">
            <div class="sm:hidden p-3">
              <select v-model="activeSection" class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50">
                <option v-for="section in sections" :key="section.id" :value="section.id">{{ section.label }}</option>
              </select>
            </div>
            <div class="hidden sm:flex flex-row overflow-x-auto no-scrollbar">
              <button
                v-for="section in sections"
                :key="section.id"
                @click="activeSection = section.id"
                class="px-4 py-3 text-sm font-medium flex items-center whitespace-nowrap"
                :class="{
                  'text-[#f02c56] border-b-2 border-[#f02c56]': activeSection === section.id,
                  'text-gray-500 hover:text-[#f02c56] hover:bg-gray-50': activeSection !== section.id
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
            <LogisticsSection v-if="activeSection === 'logistics'" :orders="orders" :shippingZoneCount="wallet?.shippingZones?.length || 0" />
            <AnalyticsSection v-if="activeSection === 'analytics'" :sales-data="salesData" />
            <CustomersSection v-if="activeSection === 'customers'" :customers="customers" />
            <InventorySection v-if="activeSection === 'inventory'" :products="products" />
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
import { useProductStore, useUserStore} from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useSupabaseClient } from '#imports';
import { notify } from '@kyvg/vue3-notification';
import { formatNumber, formatPrice } from '~/utils/formatters';
import DashboardSkeleton from '~/components/skeletons/DashboardSkeleton.vue';
// Components
import DashboardStat from '~/components/seller/dashboard/DashboardStat.vue';
import ProductsSection from '~/components/seller/dashboard/ProductsSection.vue';
import AdsSection from '~/components/seller/dashboard/AdsSection.vue';
import SettingsSection from '~/components/seller/dashboard/SettingsSection.vue';
import CustomersSection from '~/components/seller/dashboard/CustomersSection.vue';
import InventorySection from '~/components/seller/dashboard/InventorySection.vue';
import AIEnhancementSection from '~/components/seller/dashboard/AIEnhancementSection.vue';
import MessagesSection from '~/components/seller/dashboard/MessagesSection.vue';
import LogisticsSection from '~/components/seller/dashboard/LogisticsSection.vue';
import OrdersSection from '~/components/seller/dashboard/OrdersSection.vue';
import AnalyticsSection from '~/components/seller/dashboard/AnalyticsSection.vue';
import EarningsSection from '~/components/seller/dashboard/EarningSection.vue';

const router = useRouter();
const productStore = useProductStore();
const userStore = useUserStore();
const cartStore = useCartStore();
const orderStore = useOrderStore();
const apiService = useApiService();
const supabase = useSupabaseClient();

const activeSection = ref('products');
const showNotificationMenu = ref(false);

const { data: dashboardData, pending, error, refresh } = await useAsyncData('seller-dashboard', async () => {
  if (!userStore.isLoggedIn || !userStore.isSeller) {
    throw createError({ statusCode: 403, message: 'You must be a seller to view this page.' });
  }
  
  await userStore.fetchUserAndProfile();
  const storeSlug = userStore.sellerProfile?.store_slug;
  if (!storeSlug) {
      throw createError({ statusCode: 404, message: 'Seller store profile could not be found.' });
  }

  const [products, orders, wallet, customers, notifications] = await Promise.all([
    productStore.getProductsByStoreSlug(storeSlug),
    orderStore.fetchSellerOrders(userStore.user?.id as string),
    apiService.getSellerWallet(),
    Promise.resolve([]), // Replace with your customer fetching logic
    Promise.resolve([])  // Replace with your notification fetching logic
  ]);

    // orders.push(...orderStore.pendingSellerOrders)

  return { products, orders, wallet, customers, notifications };
});

// --- NEW: REAL-TIME SUBSCRIPTION ---
let channel: any = null;
onMounted(() => {
    // Listen for any changes to the 'Orders' table that match the seller's user ID
    channel = supabase
        .channel('public:Orders')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Orders', filter: `userId=eq.${userStore.user?.id}` }, (payload) => {
            console.log('Order update received!', payload);
            notify({ type: 'success', text: 'An order has been updated!' });
            // When an update is received, automatically refresh the dashboard data
            refresh();
        })
        .subscribe();
});

onUnmounted(() => {
    // It's crucial to remove the subscription when the component is destroyed to prevent memory leaks
    if (channel) {
        supabase.removeChannel(channel);
    }
});

// --- END OF NEW LOGIC ---

const products = computed(() => dashboardData.value?.products || []);
const orders = computed(() => dashboardData.value?.orders || []);
const wallet = computed(() => dashboardData.value?.wallet || null);
const customers = computed(() => dashboardData.value?.customers || []);
const notifications = computed(() => dashboardData.value?.notifications || []);
const unreadNotifications = computed(() => notifications.value.filter(n => !n.read).length);

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
  { id: 'inventory', label: 'Inventory', icon: 'mdi:warehouse' },
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

