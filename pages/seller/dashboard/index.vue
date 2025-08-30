<template>
  <div class="min-h-screen bg-gray-50">
    <header class="sticky top-0 z-10 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <button 
          @click="navigateHome"
          class="flex items-center text-gray-700 hover:text-brand-dark transition-colors"
        >
          <Icon name="mdi:arrow-left" size="24" />
          <span class="font-medium text-sm ml-2 hidden sm:inline">Back to Home</span>
        </button>
        
        <div class="flex items-center space-x-2 sm:space-x-4">
          <button 
            @click="refreshData"
            class="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Refresh Data"
          >
            <Icon name="mdi:refresh" size="20" />
          </button>
          <div class="relative">
            <button 
              @click="showNotificationMenu = !showNotificationMenu"
              class="p-2 rounded-full hover:bg-gray-100 text-gray-600 relative"
              aria-label="Notifications"
            >
              <Icon name="mdi:bell-outline" size="22" />
              <span v-if="unreadNotifications" class="absolute top-1 right-1 bg-brand text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                {{ unreadNotifications }}
              </span>
            </button>
            <!-- Notification dropdown remains the same -->
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="px-4 py-6">
      <div class="mb-6">
          <div class="flex overflow-x-auto space-x-4 pb-4 no-scrollbar">
              <div class="flex-shrink-0 w-3/4 sm:w-1/2 md:w-1/3 lg:w-1/4" v-for="stat in stats" :key="stat.title">
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
        <!-- 
          IMPROVED NAVIGATION:
          - On mobile, this is now a clean dropdown.
          - On desktop, it's a scrollable tab bar.
        -->
        <nav class="border-b border-gray-200">
          <div class="sm:hidden p-3">
            <select v-model="activeSection" class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50">
              <option v-for="section in sections" :key="section.id" :value="section.id">
                {{ section.label }}
              </option>
            </select>
          </div>
          <div class="hidden sm:flex flex-row overflow-x-auto no-scrollbar">
            <button
              v-for="section in sections"
              :key="section.id"
              @click="activeSection = section.id"
              class="px-4 py-3 text-sm font-medium flex items-center whitespace-nowrap"
              :class="{
                'text-brand-dark border-b-2 border-[#C42B78]': activeSection === section.id,
                'text-gray-500 hover:text-brand-dark hover:bg-gray-50': activeSection !== section.id
              }"
            >
              <Icon :name="section.icon" size="18" class="mr-2" />
              {{ section.label }}
            </button>
          </div>
        </nav>

        <div v-if="loading" class="py-12 flex justify-center"><LoadingSpinner /></div>
        <div v-else-if="error" class="p-4 bg-red-50 text-red-700">{{ error }}</div>
        
        <!-- Content Sections -->
        <div v-else class="p-4 sm:p-6">
          <!-- Your v-if sections for Products, Ads, Settings, etc. go here -->
         <ProductsSection v-if="activeSection === 'products'" :products="products" @update="fetchProducts"
            @product-added="handleProductAdded" />
          <AdsSection v-if="activeSection === 'ads'" :products="products" />
          <SettingsSection v-if="activeSection === 'settings'" />
          <CustomersSection v-if="activeSection === 'customers'" :customers="customers" />
          <InventorySection v-if="activeSection === 'inventory'" :products="products" />
          <AIEnhancementSection v-if="activeSection === 'ai-enhancement'" :products="products"
            @update="fetchProducts" />
          <MessagesSection v-if="activeSection === 'messages'" :unread-count="unreadMessages" />
          <LogisticsSection v-if="activeSection === 'logistics'" :orders="pendingOrders" />
          <OrdersSection v-if="activeSection === 'orders'" :orders="orders" @order-updated="fetchOrders" />
          <AnalyticsSection v-if="activeSection === 'analytics'" :sales-data="salesData" />
          <!-- ... and so on for all your other sections -->
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore, useUserStore} from '~/stores';
// Components
import LoadingSpinner from '@/components/shared/Loading.vue';
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

import type { ProductInterface } from '~/models/interface/products/product.interface';
import { type SellerStoreInterface } from '~/models/interface/auth/user.interface';

const router = useRouter();
const productStore = useProductStore();
const userStore = useUserStore();

const activeSection = ref('products');
const loading = ref(true);
const error = ref<string | null>(null);
const products = ref<ProductInterface[]>([]);
const orders = ref<any[]>([]);
const showNotificationMenu = ref(false);
const notifications = ref<any[]>([]); // You would fetch these
const unreadNotifications = ref(3); // Example value
const sellerStore = ref<SellerStoreInterface>({} as SellerStoreInterface);

const sections = [
  { id: 'products', label: 'Products', icon: 'mdi:package-variant' },
  { id: 'orders', label: 'Orders', icon: 'mdi:clipboard-list' },
  { id: 'analytics', label: 'Analytics', icon: 'mdi:chart-line' },
  { id: 'customers', label: 'Customers', icon: 'mdi:account-group' },
  { id: 'inventory', label: 'Inventory', icon: 'mdi:warehouse' },
  { id: 'messages', label: 'Messages', icon: 'mdi:chat' },
  { id: 'ads', label: 'Ads', icon: 'mdi:advertisements' },
  { id: 'logistics', label: 'Logistics', icon: 'mdi:truck' },
  { id: 'ai-enhancement', label: 'AI Tools', icon: 'mdi:robot' },
  { id: 'settings', label: 'Settings', icon: 'mdi:cog' },
];

// Data for the stats bar
const stats = computed(() => [
    { title: "Total Sales", value: `$${totalSales.value.toFixed(2)}`, icon: "mdi:cash-multiple", trend: "up", change: 15.2 },
    { title: "Orders", value: totalOrders.value.toString(), icon: "mdi:package-variant-closed", trend: "up", change: 8.7 },
    { title: "Products", value: products.value.length.toString(), icon: "mdi:shopping", trend: "neutral", change: 0 },
    { title: "Conversion", value: `${conversionRate.value}%`, icon: "mdi:trending-up", trend: "down", change: 3.5 }
]);

const totalSales = computed(() => 0); // Replace with real data
const totalOrders = computed(() => 0); // Replace with real data
const conversionRate = computed(() => "0.0"); // Replace with real data
const salesData = computed(() => ({})); // Replace with real data

const navigateHome = () => router.push('/')

const fetchProducts = async () => {
  const storeName = sellerStore.value.store_name
  if (!storeName) {
    error.value = 'No store found', 'source: Dashboard.fetchProducts';
    return;
  }
  try {
    const sellerProducts = await productStore.getProductsByStoreName(storeName)
    products.value = sellerProducts;
  } catch (err) {
    error.value = 'Failed to load products';
    console.error('Error fetching products:', err);
  }
};

const fetchOrders = async () => {
  try {
    // const sellerOrders = await orderStore.getOrdersBySeller(userStore.user?.id || '');
    // orders.value = sellerOrders;
  } catch (err) {
    console.error('Error fetching orders:', err);
  }
};

const fetchCustomers = async () => { // TODO check this fetchCustomer
  try {
    // const { data: customerData } = await supabase
    //   .from('Profiles')
    //   .select('id, email, role, avatar, username')
    //   .eq('role', 'buyer');
    // customers.value = customerData || [];
  } catch (err) {
    console.error('Error fetching customers:', err);
  }
};

const fetchStoreProfile = async () => {
  try {
    await userStore.fetchMyStore()
    if (userStore.seller) {
      sellerStore.value = userStore.seller
    }
  } catch (err) {
    console.error('Error fetching seller profile:', err);
  }
};

const fetchNotifications = async () => {
  notifications.value = [
    { id: 1, message: 'New order #1234 received', read: false },
    { id: 2, message: 'Product "Premium Headphones" is low in stock', read: false },
    { id: 3, message: 'Your store has been featured', read: true }
  ];
  unreadNotifications.value = notifications.value.filter(n => !n.read).length;
};

const fetchData = async () => {
  if (!userStore.user) {
    error.value = 'Please log in to access the dashboard';
    await navigateTo('/auth/login');
    return;
  }
  try {
    loading.value = true;
    error.value = null;

    // await userStore.fetchUserAndProfile();
    await fetchStoreProfile();
    await Promise.all([
      fetchProducts(),
      fetchOrders(),
      fetchCustomers(),
      fetchNotifications()
    ]);
  } catch (err) {
    error.value = 'Failed to load dashboard data';
    console.error('Dashboard fetch error:', err);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  fetchData();
};

const handleProductAdded = (newProduct: ProductInterface) => {
  products.value.unshift(newProduct);
};


onMounted(fetchData);

</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>