<template>
        <!-- Chat Panel (Desktop only) -->
      <div
        v-if="true"
        class="hidden lg:block w-[440px] shrink-0 bg-white rounded-lg shadow-lg p-3 ml-3 fixed right-2 top-16 bottom-4 overflow-y-auto z-10"
      >
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between border-b pb-2 mb-2">
            <h2 class="text-base font-semibold text-gray-900">AI Assistant</h2>
            <button @click="toggleChat" class="text-gray-500 hover:text-gray-700">
              <Icon name="mdi:close" size="18" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto space-y-2 text-sm" id="chat-messages">
            <p v-for="(message, index) in chatMessages" :key="index" class="text-gray-700">
              {{ message }}
            </p>
          </div>
          <div class="mt-2">
            <form @submit.prevent="sendMessage" class="flex items-center gap-1">
              <input
                v-model="messageInput"
                type="text"
                placeholder="Type message..."
                class="w-full p-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#f02c56]"
              />
              <button
                type="submit"
                class="p-1.5 bg-[#f02c56] text-white rounded-lg hover:bg-[#df4949]"
              >
                <Icon name="mdi:send" size="16" />
              </button>
            </form>
          </div>
        </div>
      </div>
</template>

<script lang="ts" setup>
// Chat functionality
const isChatOpen = ref(false);
const messageInput = ref('');
const chatMessages = ref<string[]>([]);
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

<style>

</style>