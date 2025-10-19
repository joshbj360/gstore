<template>
    <div class="p-8 max-w-2xl mx-auto">
        <h1 class="text-2xl font-bold mb-4">Supabase Realtime Test</h1>

        <div class="bg-white p-6 rounded-lg shadow-md space-y-4">
            <div>
                <h2 class="font-semibold">Connection Status:</h2>
                <p class="text-sm" :class="isConnected ? 'text-green-600' : 'text-brand font-mono bg-red-50 p-2 rounded'">
                    {{ connectionStatus }}
                </p>
            </div>

            <div class="border-t pt-4">
                <h2 class="font-semibold">Test Action:</h2>
                <p class="text-xs text-gray-500 mb-2">
                    Click this button to insert a test comment. Open this page in two different browser windows to see if the update appears below.
                </p>
                <button @click="insertTestComment" class="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold text-sm">
                    Insert Test Comment
                </button>
            </div>

            <div class="border-t pt-4">
                <h2 class="font-semibold">Received Real-time Events:</h2>
                <div v-if="receivedPayloads.length === 0" class="text-sm text-gray-500 mt-2">
                    Waiting for events...
                </div>
                <pre v-else v-for="(payload, index) in receivedPayloads" :key="index" class="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">{{ JSON.stringify(payload, null, 2) }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import type { RealtimeChannel } from '@supabase/supabase-js';

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const connectionStatus = ref('Connecting...');
const isConnected = ref(false);
const receivedPayloads = ref<any[]>([]);

let channel: RealtimeChannel | null = null;
const TEST_PRODUCT_ID = 1;

onMounted(() => {
    if (!channel) {
        channel = supabase
            .channel('test-all-comments') // Use a new channel name for the test
            .on('postgres_changes', {
                event: '*', 
                schema: 'public',
                table: 'Comment',
                // THE FIX: The filter has been temporarily removed for this diagnostic test.
                // This will listen for ANY change on the Comment table.
            },
            (payload) => {
                console.log('SUCCESS: Real-time payload received!', payload);
                receivedPayloads.value.push(payload);
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    connectionStatus.value = `Successfully subscribed to ALL comments. Waiting for events...`;
                    isConnected.value = true;
                }
                if (status === 'CHANNEL_ERROR') {
                    connectionStatus.value = `Channel Error: ${err?.message || 'An unknown error occurred.'}`;
                    console.error('Supabase Channel Error:', err);
                    isConnected.value = false;
                }
                if (status === 'TIMED_OUT') {
                    connectionStatus.value = 'Connection timed out.';
                    isConnected.value = false;
                }
            });
    }
});

onUnmounted(() => {
    if (channel) {
        supabase.removeChannel(channel);
        channel = null;
    }
});

const insertTestComment = async () => {
    if (!user.value) {
        alert("Please log in to insert a comment.");
        return;
    }
    try {
        const { error } = await supabase.from('Comment').insert({
            productId: TEST_PRODUCT_ID,
            authorId: user.value.id,
            text: `This is a test comment at ${new Date().toLocaleTimeString()}`,
        });
        if (error) throw error;
        alert("Test comment inserted successfully. Check other browser windows for a real-time update.");
    } catch (error) {
        console.error("Error inserting test comment:", error);
        alert("Failed to insert test comment. Check the console for errors.");
    }
};
</script>

