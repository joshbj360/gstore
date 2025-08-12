<template>
  <div class="min-h-screen bg-gray-50 relative" id="mainlayout">
    <!-- Top Navigation - Reduced padding for mobile -->
    <TopNav :user="user" :userStore="userStore" class="px-2 sm:px-4" />

    <!-- Mobile Category Slider - Tight padding -->
    <div class="md:hidden pt-1 px-2">
      <CategoryList />
    </div>

    <!-- Main Content Area - Adjusted for mobile -->
    <div class="flex justify-center mx-auto w-full px-1 sm:px-2 lg:px-4 max-w-[1440px]">
      <!-- Sidebar: Hidden on mobile -->
      <div class="hidden lg:block w-64 shrink-0 bg-white rounded-lg shadow-sm">
        <SideNavMain />
      </div>

      <!-- Main Content Slot - Reduced padding -->
      <main class="flex-1 py-2 sm:py-3 px-0 sm:px-1">
        <slot />
      </main>

      <!-- Chat Component - Positioned on the right side -->
      <Chat class="hidden lg:block" />
    </div>

    <!-- Mobile Chat Button - Smaller and more compact -->
    <div class="">
      <FloatingSidePanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '~/stores/user.store';
import TopNav from './children/TopNav.vue';
import CategoryList from '~/components/category/CategoryList.vue';
import Chat from '~/components/chat/AIChat.vue';
import SideNavMain from './children/SideNavMain.vue';
import FloatingSidePanel from './children/FloatingSidePanel.vue';
import { useRoute, useSupabaseUser } from '#imports';

const userStore = useUserStore();
const user = useSupabaseUser();
const route = useRoute();


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