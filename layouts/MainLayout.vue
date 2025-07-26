<template>
  <div class="min-h-screen bg-gray-100 relative" id="mainlayout">
    <!-- Top Navigation - Reduced padding for mobile -->
    <TopNav :user="user" :userStore="userStore" class="px-2 sm:px-4" />

    <!-- Mobile Category Slider - Tight padding -->
    <div class="md:hidden pt-1 px-2">
      <CategoryList />
    </div>

    <!-- Main Content Area - Adjusted for mobile -->
    <div class="flex justify-between mx-auto w-full px-2 sm:px-4 lg:px-6 max-w-[1440px]">
      <!-- Sidebar: Hidden on mobile -->
      <div class="hidden lg:block w-64 shrink-0 bg-white rounded-lg shadow-sm">
        <SideNavMain />
      </div>

      <!-- Main Content Slot - Reduced padding -->
      <main class="flex-1 py-4 px-1 sm:px-0">
        <slot />
      </main>

      <!-- Chat Panel (Desktop only) -->
      <div
        v-if="isChatOpen"
        class="hidden lg:block w-80 shrink-0 bg-white rounded-lg shadow-lg p-3 ml-4 fixed right-2 top-20 bottom-4 overflow-y-auto z-10"
      >
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between border-b pb-2 mb-3">
            <h2 class="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <button @click="toggleChat" class="text-gray-500 hover:text-gray-700">
              <Icon name="mdi:close" size="20" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto space-y-3 text-sm" id="chat-messages">
            <!-- Chat messages -->
          </div>
          <div class="mt-3">
            <form @submit.prevent="sendMessage" class="flex items-center gap-1">
              <input
                v-model="messageInput"
                type="text"
                placeholder="Type message..."
                class="w-full p-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#f02c56]"
              />
              <button
                type="submit"
                class="p-1.5 bg-[#f02c56] text-white rounded hover:bg-[#df4949]"
              >
                <Icon name="mdi:send" size="18" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Chat Button - Smaller and more compact -->
    <button
      class="fixed bottom-3 right-3 lg:hidden bg-[#f02c56] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md z-40"
      @click="toggleChat"
    >
      <Icon name="mdi:chat" size="20" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '~/stores/user.store';
import TopNav from './children/TopNav.vue';
import CategoryList from '~/components/category/CategoryList.vue';
import SideNavMain from './children/SideNavMain.vue';
import { useRoute, useSupabaseUser } from '#imports';

const userStore = useUserStore();
const user = useSupabaseUser();
const route = useRoute();

// Chat functionality
const isChatOpen = ref(false);
const messageInput = ref('');
const chatMessages = ref([]);
const isSending = ref(false);

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
};

const sendMessage = () => {
  if (messageInput.value.trim()) {
    isSending.value = true;
    chatMessages.value.push(`You: ${messageInput.value}`);
    messageInput.value = '';
    
    setTimeout(() => {
      chatMessages.value.push('Assistant: Demo response');
      isSending.value = false;
    }, 800);
  }
};
</script>

<style scoped>
/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  #mainlayout {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }
  
  main {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }
}

/* Chat button animation */
button {
  transition: transform 0.2s ease;
}
button:active {
  transform: scale(0.95);
}
</style>