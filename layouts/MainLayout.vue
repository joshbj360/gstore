<template>
  <div class="min-h-screen bg-gray-50" id="mainlayout">
    <!-- Persistent Top Navigation for all screen sizes -->
    <TopNav />

    <div class="flex justify-center mx-auto w-full px-2 sm:px-4 lg:px-6 max-w-[1440px]">
      
      <!-- DESKTOP SIDEBAR -->
      <div class="hidden lg:block w-72 shrink-0">
        <SideNavMain />
      </div>

      <!-- MAIN CONTENT COLUMN -->
      <main class="flex-1 min-w-0 pt-16 lg:pt-20">
        <!-- Mobile Category Slider -->
        <TopMobileCategoryList class="lg:hidden" />
        
        <!-- Advertisement Section -->
        <AdvertSection class="mt-4" />
        
        <!-- ProductLayout is rendered here via the slot -->
        <div class="px-1 sm:px-2">
            <slot />
        </div>
      </main>
    </div>

    <!-- DESKTOP CHAT PANEL (Right Side) -->
    <div class="hidden lg:block">
      <!-- Collapsible Chat Window -->
      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in"
        enter-from-class="translate-x-full"
        leave-to-class="translate-x-full"
      >
        <Chat 
          v-if="isChatOpen"
          class="fixed top-0 right-0 w-96 h-screen border-l bg-white z-50"
          @close="isChatOpen = false" 
        />
      </transition>
      
      <!-- Floating Button to Open Chat -->
      <button 
        v-if="!isChatOpen"
        @click="isChatOpen = true"
        class="fixed bottom-6 right-6 bg-[#C42B78] text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-[#df4949] transition-transform hover:scale-110 z-40"
        aria-label="Open AI Chat"
      >
        <Icon name="mdi:chat-processing-outline" size="28" />
      </button>
    </div>

    <!-- MOBILE CHAT (Modal) -->
    <div v-if="isMobileChatOpen" class="lg:hidden">
      <div @click="isMobileChatOpen = false" class="fixed inset-0 bg-black/40 z-40"></div>
      <Chat 
        class="fixed bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl z-50"
        @close="isMobileChatOpen = false"
      />
    </div>

    <!-- MOBILE FLOATING NAVIGATION -->
    <FloatingNavMobile @open-chat="isMobileChatOpen = true" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TopNav from './children/TopNav.vue';
import TopMobileCategoryList from '@/layouts/children/TopMobileCategory.vue'
import Chat from '@/components/chat/AIChat.vue';
import SideNavMain from './children/SideNavMain.vue';
import AdvertSection from '@/components/AdvertSection.vue';
import FloatingNavMobile from '../layouts/children/FloatingNavMobile.vue';

// State for desktop chat panel
const isChatOpen = ref(false);
// State for mobile chat modal
const isMobileChatOpen = ref(false);
</script>