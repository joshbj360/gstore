<template>
    <div class="h-full flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b shrink-0 flex justify-between items-center">
            <h3 class="font-semibold text-gray-800">Comments</h3>
            <div class="w-2 h-2 rounded-full transition-colors" :class="isConnected ? 'bg-green-500' : 'bg-gray-300'" title="Real-time Connection Status"></div>
        </div>

        <!-- Loading/Empty States -->
        <div v-if="commentStore.isLoading && !comments" class="flex-1 flex items-center justify-center text-gray-500">Loading comments...</div>
        <div v-else-if="!comments || comments.length === 0" class="flex-1 flex items-center justify-center text-gray-500">
            <p>No comments yet. Be the first!</p>
        </div>

        <!-- Comments List -->
        <div v-else class="flex-1 overflow-y-auto p-4 space-y-4">
            <div v-for="comment in comments" :key="comment.id" class="flex items-start gap-3">
                <img :src="comment.author.avatar || `https://avatar.iran.liara.run/public/boy?username=${comment.author.username}`" class="w-8 h-8 rounded-full bg-gray-200">
                <div class="flex-1">
                    <p class="text-sm">
                        <span class="font-semibold text-gray-800">{{ comment.author.username || 'A user' }}</span>
                        <span class="text-gray-600 ml-1">{{ comment.text }}</span>
                    </p>
                    <div class="text-xs text-gray-400 mt-1 flex items-center gap-3">
                        <span>{{ new Date(comment.created_at).toLocaleDateString() }}</span>
                        <button class="font-semibold">Reply</button>
                    </div>
                </div>
                <button class="flex flex-col items-center text-gray-500">
                    <Icon name="mdi:heart-outline" size="18" />
                    <span class="text-xs">{{ comment._count?.likes }}</span>
                </button>
            </div>
        </div>

        <!-- Comment Input Form -->
        <div class="p-4 border-t bg-gray-50 shrink-0">
            <form @submit.prevent="postComment" class="flex items-center gap-2">
                <TextInput v-model:input="newCommentText" placeholder="Add a comment..." class="flex-1" />
                <button type="submit" :disabled="commentStore.isLoading.posting || commentStore.isLoading.fetching" class="px-4 py-2 bg-[#f02c56] text-white rounded-lg font-semibold text-sm disabled:opacity-70">
                    <span v-if="commentStore.isLoading.posting">Posting...</span>
                    <span v-if="commentStore.isLoading.fetching">Fetching...</span>
                    <span v-else>Post</span>
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useUserStore, useCommentStore } from '~/stores';
import type { IProduct } from '~/models';
import TextInput from '~/components/shared/TextInput.vue';
import { notify } from '@kyvg/vue3-notification';

const props = defineProps<{
    product: IProduct;
}>();

const userStore = useUserStore();
const commentStore = useCommentStore();

const newCommentText = ref('');

const comments = computed(() => commentStore.commentsCache.get(props.product.id));
const isConnected = computed(() => commentStore.isConnected);

onMounted(() => {
    // Tell the store to fetch initial data and subscribe to updates.
    commentStore.fetchComments(props.product.id);
    commentStore.subscribeToComments(props.product.id);
});

onUnmounted(() => {
    // When the component is destroyed, tell the store to clean up the connection.
    commentStore.unsubscribeFromComments();
});

const postComment = async () => {
    if (!newCommentText.value.trim()) return;
    if (!userStore.isLoggedIn) {
        notify({ type: 'warn', text: 'You must be logged in to comment.' });
        return;
    }

    const success = await commentStore.postComment({
        productId: props.product.id,
        text: newCommentText.value,
    });

    if (success) {
        newCommentText.value = ''; // Clear input on success
    }
};
</script>

