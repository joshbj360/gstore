<template>
  <div class="p-6 md:p-8 max-w-6xl mx-auto">
    <NuxtLink to="/"
      class="absolute top-4 left-4 z-40 flex items-center bg-white/80 p-2 rounded-full shadow-md hover:bg-[#f02c56] hover:text-white transition-all"
      aria-label="Back to Homepage">
      <Icon name="mdi:arrow-left" size="20" />
    </NuxtLink>
    <!-- Seller Header Section -->
    <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div class="flex items-start gap-4">
          <NuxtLink :to="`/seller/profile/${sellerStore?.store_name}`" class="group relative shrink-0">
            <div class="absolute inset-0 rounded-full bg-gradient-to-br from-[#f02c56]/10 to-[#f02c56]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              loading="lazy"
              :src="sellerStore?.store_logo || '/default-store-logo.png'" 
              :alt="sellerStore?.store_name || 'Store logo'"
              class="rounded-full w-16 h-16 md:w-20 md:h-20 object-cover border-2 border-gray-100 group-hover:border-[#f02c56]/20 transition-all duration-300"
            />
          </NuxtLink>
          
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl md:text-2xl font-bold text-gray-900">
                {{ sellerStore?.store_name || 'Unknown Store' }}
              </h1>
              <Icon 
                v-if="sellerStore?.is_verified" 
                name="mdi:check-decagram" 
                size="20" 
                class="text-[#f02c56]" 
              />
            </div>
            
            <p class="text-gray-600 mt-1 max-w-lg">
              {{ sellerStore?.store_description || 'No store description available' }}
            </p>
            
            <div class="flex items-center gap-4 mt-3 text-sm">
              <div class="flex items-center text-gray-500">
                <Icon name="mdi:map-marker" size="16" class="mr-1" />
                <span>{{ sellerStore?.store_location || 'Location not specified' }}</span>
              </div>
              
              <div class="flex items-center text-gray-500">
                <Icon name="mdi:account-multiple" size="16" class="mr-1" />
                <span>{{ formatNumber(sellerStore?.followers_count || 0) }} followers</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button
            @click="openChat"
            class="px-5 py-2.5 rounded-lg font-medium text-sm border border-[#f02c56] text-[#f02c56] hover:bg-[#f02c56]/10 transition-colors"
          >
            <Icon name="mdi:message" size="18" class="mr-2" />
            Chat with Seller
          </button>
          
          <button
            v-if="userStore.isLoggedIn"
            @click="toggleFollow"
            class="px-5 py-2.5 rounded-lg font-medium text-sm border transition-colors"
            :class="{
              'border-[#f02c56] text-[#f02c56] hover:bg-[#f02c56]/10': !isFollowing,
              'bg-[#f02c56] text-white border-[#f02c56]': isFollowing
            }"
          >
            {{ isFollowing ? 'Following' : 'Follow' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Store Navigation -->
    <div class="flex items-center border-b border-gray-200 mb-8">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-3 font-medium text-sm relative"
        :class="{
          'text-[#f02c56]': activeTab === tab.id,
          'text-gray-600 hover:text-gray-900': activeTab !== tab.id
        }"
      >
        {{ tab.label }}
        <span
          v-if="activeTab === tab.id"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f02c56]"
        ></span>
      </button>
    </div>
    
    <!-- Products Grid -->
    <div v-if="activeTab === 'products'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        class="w-full"
      />
    </div>
    
    <!-- About Tab -->
    <div v-if="activeTab === 'about'" class="bg-white rounded-xl shadow-sm p-6">
      <h2 class="text-lg font-bold mb-4">About This Store</h2>
      <div class="prose prose-sm text-gray-600">
        <p>{{ sellerStore?.store_description || 'No description available' }}</p>
        
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-2 flex items-center gap-2">
              <Icon name="mdi:calendar" size="18" class="text-[#f02c56]" />
              <span>Store Since</span>
            </h3>
            <p>{{ formatDate(sellerStore?.created_at) || 'Not specified' }}</p>
          </div>
          
          <div>
            <h3 class="font-medium mb-2 flex items-center gap-2">
              <Icon name="mdi:map-marker" size="18" class="text-[#f02c56]" />
              <span>Location</span>
            </h3>
            <p>{{ sellerStore?.store_location || 'Not specified' }}</p>
          </div>
          
          <div>
            <h3 class="font-medium mb-2 flex items-center gap-2">
              <Icon name="mdi:shield-check" size="18" class="text-[#f02c56]" />
              <span>Verification</span>
            </h3>
            <p>{{ sellerStore?.is_verified ? 'Verified Seller' : 'Not Verified' }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
    
    <!-- Empty State -->
    <div v-if="!loading && products.length === 0 && activeTab === 'products'" class="text-center py-12">
      <Icon name="mdi:package-variant-closed" size="48" class="mx-auto text-gray-300 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
      <p class="text-gray-500 max-w-md mx-auto">This store hasn't listed any products yet.</p>
    </div>
    
    <!-- Chat Modal -->
    <div v-if="showChat" class="fixed inset-0 z-50 overflow-hidden">
      <div class="absolute inset-0 bg-black/50" @click="showChat = false"></div>
      
      <div class="absolute bottom-0 right-0 w-full max-w-md h-[70vh] bg-white rounded-t-xl shadow-xl flex flex-col">
        <!-- Chat Header -->
        <div class="p-4 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img 
              :src="sellerStore?.store_logo || '/default-store-logo.png'" 
              class="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 class="font-medium">Chat with {{ sellerStore?.store_name }}</h3>
              <p class="text-xs text-gray-500">Typically replies within 24 hours</p>
            </div>
          </div>
          <button @click="showChat = false" class="text-gray-500 hover:text-gray-700">
            <Icon name="mdi:close" size="20" />
          </button>
        </div>
        
        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-for="(message, index) in messages" :key="index" 
            :class="{
              'flex justify-end': message.sender === 'user',
              'flex justify-start': message.sender === 'seller'
            }"
          >
            <div 
              :class="{
                'bg-[#f02c56]/10 text-gray-800 rounded-l-xl rounded-br-xl': message.sender === 'user',
                'bg-gray-100 text-gray-800 rounded-r-xl rounded-bl-xl': message.sender === 'seller'
              }" 
              class="max-w-xs md:max-w-md p-3"
            >
              <p>{{ message.text }}</p>
              <p class="text-xs text-gray-500 mt-1 text-right">{{ formatTime(message.time) }}</p>
            </div>
          </div>
        </div>
        
        <!-- Chat Input -->
        <div class="p-4 border-t border-gray-200">
          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input
              v-model="newMessage"
              type="text"
              placeholder="Type your message..."
              class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50 focus:border-transparent"
            />
            <button 
              type="submit"
              class="bg-[#f02c56] text-white p-2 rounded-lg hover:bg-[#e6375d] transition-colors"
              :disabled="!newMessage.trim()"
            >
              <Icon name="mdi:send" size="20" />
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { type SellerStoreInterface } from '~/models/interface/auth/user.interface';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { useUserStore } from '~/stores/user.store';
import { useProductStore } from '#imports';
import ProductCard from '~/components/product/productCard/ProductCard.vue';

const route = useRoute();
const userStore = useUserStore();
const productStore = useProductStore();

const storeName = route.params.store_name as string;
const sellerStore = ref<SellerStoreInterface | null>(null);
const products = ref<ProductInterface[]>([]);
const loading = ref(true);
const isFollowing = ref(false);
const activeTab = ref('products');
const showChat = ref(false);
const newMessage = ref('');
const messages = ref([
  { text: 'Hello! How can I help you today?', sender: 'seller', time: new Date() },
]);

const tabs = [
  { id: 'products', label: 'Products' },
  { id: 'about', label: 'About' },
  { id: 'reviews', label: 'Reviews' }
];

// Formatting helpers
const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Chat functions
const openChat = () => {
  if (!userStore.isLoggedIn) {
    // Redirect to login or show login modal
    return;
  }
  showChat.value = true;
};

const sendMessage = () => {
  if (!newMessage.value.trim()) return;
  
  // Add user message
  messages.value.push({
    text: newMessage.value,
    sender: 'user',
    time: new Date()
  });
  
  // Simulate seller reply after 1 second
  setTimeout(() => {
    messages.value.push({
      text: 'Thanks for your message! We will get back to you soon.',
      sender: 'seller',
      time: new Date()
    });
  }, 1000);
  
  newMessage.value = '';
};

// Fetch store data
onMounted(async () => {
  try {
    loading.value = true;
    await userStore.fetchSellerStoreByStoreName(storeName);
    sellerStore.value = userStore.seller;
    
    // Fetch store products
    products.value = await productStore.getProductsByStoreName(storeName)
  } catch (error) {
    console.error('Error loading store data:', error);
  } finally {
    loading.value = false;
  }
});

const toggleFollow = async () => {
  try {
    // Call API to follow/unfollow
    isFollowing.value = !isFollowing.value;
    // Update followers count optimistically
    if (sellerStore.value) {
      sellerStore.value.followers_count ? sellerStore.value.followers_count += isFollowing.value ? 1 : -1 : 0;
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
  }
};
</script>

<style scoped>
/* Custom styles for chat scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #f02c56;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #e6375d;
}
</style>