<template>
  <div>
    <h2 class="text-lg font-medium mb-4">Messages & Feedback</h2>
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <div v-for="message in messages" :key="message.id" class="border-b py-2">
        <p><strong>{{ message.user }}</strong>: {{ message.text }}</p>
        <p class="text-xs text-gray-500">{{ message.created_at }}</p>
      </div>
      <form @submit.prevent="sendReply" class="mt-4">
        <input v-model="reply" class="w-full p-2 border rounded-lg" placeholder="Reply to customer..." />
        <button class="mt-2 bg-[#f02c56] text-white px-4 py-2 rounded-lg hover:bg-[#f02c56]/80">
          Send
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSupabaseClient } from '#imports';

const supabase = useSupabaseClient();
const messages = ref([]);
const reply = ref('');

const fetchMessages = async () => {
  const { data } = await supabase.from('messages').select('*');
  messages.value = data || [];
};

const sendReply = async () => {
  if (!reply.value) return;
  await supabase.from('messages').insert({ text: reply.value, user: 'Seller' });
  reply.value = '';
  fetchMessages();
};

onMounted(fetchMessages);
</script>