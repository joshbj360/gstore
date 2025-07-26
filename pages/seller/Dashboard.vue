<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header with Back Navigation -->
    <header class="sticky top-0 z-10 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between">
        <button 
          @click="navigateHome"
          class="flex items-center text-gray-700 hover:text-[#f02c56] transition-colors mb-2 sm:mb-0 w-full sm:w-auto"
        >
          <Icon name="mdi:arrow-left" size="24" class="mr-2" />
          <span class="font-medium text-base sm:text-sm">Back to Home</span>
        </button>
        
        <div class="flex items-center space-x-4 w-full sm:w-auto justify-end">
          <button 
            @click="refreshData"
            class="flex items-center text-sm text-gray-600 hover:text-[#f02c56] w-full sm:w-auto py-2"
          >
            <Icon name="mdi:refresh" size="20" class="mr-1" />
            Refresh
          </button>
          <div class="relative w-full sm:w-auto">
            <button 
              @click="showNotificationMenu = !showNotificationMenu"
              class="text-gray-500 hover:text-[#f02c56] relative w-full sm:w-auto flex items-center justify-center py-2"
            >
              <Icon name="mdi:bell" size="22" />
              <span v-if="unreadNotifications" class="absolute -top-1 -right-1 bg-[#f02c56] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {{ unreadNotifications }}
              </span>
            </button>
            <div 
              v-if="showNotificationMenu"
              class="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-md shadow-lg py-1 z-20"
              :class="{ 'w-64': screenWidth < 640 }"
            >
              <div class="px-4 py-2 border-b border-gray-200">
                <p class="text-sm font-medium text-gray-700">Notifications</p>
              </div>
              <div v-if="notifications.length" class="max-h-60 overflow-y-auto">
                <a 
                  v-for="notification in notifications"
                  :key="notification.id"
                  href="#"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {{ notification.message }}
                </a>
              </div>
              <p v-else class="px-4 py-2 text-sm text-gray-500">No new notifications</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="px-4 py-6">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardStat 
          title="Total Sales" 
          :value="`$${totalSales.toFixed(2)}`" 
          icon="mdi:cash-multiple" 
          trend="up" 
          :change="15.2"
        />
        <DashboardStat 
          title="Orders" 
          :value="totalOrders.toString()" 
          icon="mdi:package-variant-closed" 
          trend="up" 
          :change="8.7"
        />
        <DashboardStat 
          title="Products" 
          :value="products.length.toString()" 
          icon="mdi:shopping" 
          trend="neutral" 
          :change="0"
        />
        <DashboardStat 
          title="Conversion" 
          :value="`${conversionRate}%`" 
          icon="mdi:trending-up" 
          trend="down" 
          :change="3.5"
        />
      </div>

      <!-- Dashboard Content -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <!-- Navigation Tabs/Dropdown -->
        <nav class="border-b border-gray-200">
      <div v-if="screenWidth < 640" class="p-4">
        <select
          v-model="activeSection"
          class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50 transition-all duration-250"
        >
          <option v-for="section in sections" :key="section.id" :value="section.id">
            {{ section.label }}
          </option>
        </select>
      </div>
      <div v-else class="flex flex-row overflow-x-auto">
        <button
          v-for="section in sections"
          :key="section.id"
          @click="activeSection = section.id"
          class="px-4 py-3 text-sm font-medium flex items-center w-full sm:w-auto transition-all duration-200"
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

        <!-- Loading State -->
        <LoadingSpinner v-if="loading" class="py-12" />

        <!-- Error State -->
        <div v-else-if="error" class="p-4 bg-red-50 text-red-700 rounded-b-lg">
          <div class="flex items-center">
            <Icon name="mdi:alert-circle" size="20" class="mr-2" />
            {{ error }}
          </div>
          <button 
            @click="fetchData"
            class="mt-2 text-sm text-red-700 hover:underline w-full sm:w-auto"
          >
            Try again
          </button>
        </div>

        <!-- Content Sections -->
        <div v-else class="p-4 sm:p-6">
          <ProductsSection 
            v-if="activeSection === 'products'" 
            :products="products" 
            @update="fetchProducts" 
            @product-added="handleProductAdded"
          />
          <AdsSection 
            v-if="activeSection === 'ads'" 
            :products="products"
          />
          <SettingsSection 
            v-if="activeSection === 'settings'" 
          />
          <CustomersSection 
            v-if="activeSection === 'customers'" 
            :customers="customers" 
          />
          <InventorySection 
            v-if="activeSection === 'inventory'" 
            :products="products" 
          />
          <AIEnhancementSection 
            v-if="activeSection === 'ai-enhancement'" 
            :products="products" 
            @update="fetchProducts"
          />
          <MessagesSection 
            v-if="activeSection === 'messages'" 
            :unread-count="unreadMessages"
          />
          <LogisticsSection 
            v-if="activeSection === 'logistics'" 
            :orders="pendingOrders"
          />
          <OrdersSection 
            v-if="activeSection === 'orders'" 
            :orders="orders" 
            @order-updated="fetchOrders"
          />
          <AnalyticsSection 
            v-if="activeSection === 'analytics'" 
            :sales-data="salesData"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabaseUser, useSupabaseClient } from '#imports';
import { useProductStore } from '~/stores/product.store';
import { useUserStore } from '~/stores/user.store';
// import { useOrderStore } from '~/stores/order.store';

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

// Types
import type { Database } from '@/types/supabase';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { defaultSellerProfile, type SellerStoreInterface } from '~/models/interface/auth/user.interface';

const router = useRouter();
const user = useSupabaseUser();
const supabase = useSupabaseClient<Database>();
const productStore = useProductStore();
const userStore = useUserStore();
// const orderStore = useOrderStore();

const activeSection = ref<string | null>('products');
const loading = ref(true);
const error = ref<string | null>(null);
const products = ref<ProductInterface[]>([]);
const customers = ref<any[]>([]);
const orders = ref<any[]>([]);
const notifications = ref<any[]>([]);
const unreadNotifications = ref(3);
const unreadMessages = ref(0);
const showNotificationMenu = ref(false);
const sellerStore = ref<SellerStoreInterface>(defaultSellerProfile);
const screenWidth = ref(window.innerWidth);

// Sections
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

// Computed
const totalSales = computed(() => {
  return orders.value.reduce((sum, order) => sum + order.totalAmount, 0);
});

const totalOrders = computed(() => orders.value.length);

const conversionRate = computed(() => {
  return (products.value.length > 0 ? (orders.value.length / products.value.length * 100).toFixed(1) : 0);
});

const pendingOrders = computed(() => {
  return orders.value.filter(order => order.status === 'pending');
});

const salesData = computed(() => {
  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Sales',
      data: [1200, 1900, 1500, 2000, 1800, 2200],
      backgroundColor: '#f02c56',
      borderColor: '#d81b46',
      tension: 0.4
    }]
  };
});

// Methods
const navigateHome = () => {
  router.push('/');
};

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
    await userStore.fetchSellerStore()
    if (userStore.seller ) {
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
  if (!user.value) {
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

const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth;
};

onMounted(() => {
  fetchData();
  window.addEventListener('resize', updateScreenWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenWidth);
});
</script>

<style scoped>
.tab-enter-active,
.tab-leave-active {
  transition: opacity 0.3s ease;
}
.tab-enter-from,
.tab-leave-to {
  opacity: 0;
}
</style>