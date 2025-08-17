<template>
  <div class="hidden lg:block w-[440px] shrink-0 bg-white rounded-lg shadow-lg p-3 ml-3 fixed right-2 top-16 bottom-4 overflow-y-auto z-10">

    <div class="flex items-center justify-between border-b p-3">
      <h2 class="text-base font-semibold text-gray-900">Shopping Assistant</h2>
      <button @click="emit('close')" class="text-gray-500 hover:text-gray-700">
        <Icon name="mdi:close" size="20" />
      </button>
    </div>

    <div ref="messageContainer" class="flex-1 overflow-y-auto space-y-4 p-4 text-sm">
      <div 
        v-for="(message, index) in chatMessages" 
        :key="index"
        class="flex"
        :class="message.sender === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div 
          class="rounded-lg px-3 py-2 max-w-sm break-words"
          :class="{
            'bg-[#f02c56] text-white rounded-br-none': message.sender === 'user',
            'bg-gray-100 text-gray-800 rounded-bl-none': message.sender === 'assistant'
          }"
        >
          {{ message.text }}
        </div>
      </div>

      <div v-if="isTyping" class="flex justify-start">
        <div class="bg-gray-100 text-gray-500 rounded-lg px-3 py-2 rounded-bl-none">
          <span class="typing-indicator">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </div>
      </div>
    </div>

    <div class="mt-auto p-3 border-t bg-gray-50">
      <form @submit.prevent="sendMessage" class="flex items-start gap-2">
        <textarea
          ref="textareaRef"
          v-model="messageInput"
          @input="adjustTextareaHeight"
          @keydown.enter.prevent="sendMessage"
          placeholder="Ask about a product..."
          class="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#f02c56] resize-none"
          rows="1"
        ></textarea>
        <button
          type="submit"
          :disabled="!messageInput.trim() || isTyping"
          class="p-2 bg-[#f02c56] text-white rounded-lg hover:bg-[#df4949] disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
        >
          <Icon name="mdi:send" size="20" />
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import { useSessionStorage } from '@vueuse/core';

// This component only needs to emit a 'close' event
const emit = defineEmits(['close']);

interface ChatMessage {
  text: string;
  sender: 'user' | 'assistant';
}

// State
const messageInput = ref('');
// Use useSessionStorage to persist the conversation
const chatMessages = useSessionStorage<ChatMessage[]>('ai-chat-history', [
    { text: "Hello! How can I assist you with your shopping today?", sender: 'assistant' }
]);
const isTyping = ref(false);
const messageContainer = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// Auto-scroll to the bottom when new messages are added
watch(chatMessages, async () => {
    await nextTick();
    if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
}, { deep: true });


// Makes the textarea grow with content
const adjustTextareaHeight = () => {
    const textarea = textareaRef.value;
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
};

// Refactored to be async and have slightly more dynamic responses
const sendMessage = async () => {
  const text = messageInput.value.trim();
  if (!text || isTyping.value) return;

  chatMessages.value.push({ text, sender: 'user' });
  messageInput.value = '';
  await nextTick();
  adjustTextareaHeight();
  
  isTyping.value = true;

  // Simulate an async API call
  await new Promise(resolve => setTimeout(resolve, 1200));

  let response = 'Thank you for your message! This is a demo response.';
  if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
    response = 'Hello there! How can I help you find the perfect product?';
  } else if (text.toLowerCase().includes('shipping')) {
    response = 'We offer free 11-day shipping on most items. You can find more details at checkout!';
  }

  isTyping.value = false;
  chatMessages.value.push({ text: response, sender: 'assistant' });
};
</script>

<style scoped>
textarea {
    max-height: 120px; /* Prevent it from growing indefinitely */
}

/* Styling for the "is typing" indicator */
.typing-indicator span {
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}
.typing-indicator span:nth-child(2) {
  animation-delay: -0.2s;
}
.typing-indicator span:nth-child(3) {
  animation-delay: -0.1s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1.0);
  }
}
</style>