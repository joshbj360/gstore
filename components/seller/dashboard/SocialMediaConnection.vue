<template>
  <div class="p-6 border rounded-lg bg-white shadow-sm">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Connect Social Media</h3>
    <div class="space-y-4">
      <div v-for="platform in platforms" :key="platform.id" class="flex items-center justify-between">
        <div class="flex items-center">
          <Icon :name="platform.icon" class="text-2xl" />
          <span class="ml-3 font-medium">{{ platform.name }}</span>
        </div>
        <button @click="connect(platform.id)" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Connect
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const platforms = [
  { id: 'facebook', name: 'Facebook', icon: 'mdi:facebook' },
  { id: 'twitter', name: 'Twitter', icon: 'mdi:twitter' },
  { id: 'instagram', name: 'Instagram', icon: 'mdi:instagram' },
];

const connect = (platformId: string) => {
  // This is a placeholder for the actual OAuth flow.
  // In a real application, this would redirect the user to the social media platform's authorization page.
  alert(`Connecting to ${platformId}...`);
};
</script>
