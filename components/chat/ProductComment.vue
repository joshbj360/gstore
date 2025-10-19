<template>
    <div class="h-full flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b shrink-0 flex justify-between items-center">
            <h3 class="font-semibold text-gray-800">Comments</h3>
            <div class="w-2 h-2 rounded-full transition-colors" :class="isConnected ? 'bg-green-500' : 'bg-gray-300'"
                title="Real-time Connection Status"></div>
        </div>

        <!-- Loading/Empty States -->
        <div v-if="commentStore.isLoading && !comments" class="flex-1 flex items-center justify-center text-gray-500">
            Loading comments...</div>
        <div v-else-if="!comments || comments.length === 0"
            class="flex-1 flex items-center justify-center text-gray-500">
            <p>No comments yet. Be the first!</p>
        </div>

        <!-- Comments List -->
        <div v-else class="flex-1 overflow-y-auto p-4 space-y-4">
            <div v-for="comment in comments" :key="comment.id">
                <!-- Main Comment -->
                <div class="flex items-start gap-3">
                    <img :src="comment.author.avatar || '/default-avatar.png'" class="w-8 h-8 rounded-full bg-gray-200">
                    <div class="flex-1">
                        <p class="text-sm">
                            <span class="font-semibold text-gray-800">{{ comment.author.username || 'A user' }}</span>
                            <span class="text-gray-600 ml-1">{{ comment.text }}</span>
                        </p>
                        <div class="text-xs text-gray-400 mt-1 flex items-center gap-3">
                            <span>{{ new Date(comment.created_at).toLocaleDateString() }}</span>
                            <button @click="setReplyTo(comment)" class="font-semibold hover:underline">Reply</button>
                        </div>
                    </div>
                    <!-- THE FIX: Like button is now interactive -->
                    <button @click="toggleLike(comment)" class="flex flex-col items-center transition-colors"
                        :class="isCommentLiked(comment.id) ? 'text-brand' : 'text-gray-500 hover:text-red-400'">
                        <Icon :name="isCommentLiked(comment.id) ? 'mdi:heart' : 'mdi:heart-outline'" size="18" />
                        <span class="text-xs">{{ comment._count?.likes }}</span>
                    </button>
                </div>
                <!-- Replies -->
                <div v-if="comment.replies && comment.replies.length > 0" class="pl-8 mt-3 space-y-3">
                    <div v-for="reply in comment.replies" :key="reply.id" class="flex items-start gap-3">
                        <img :src="reply.author.avatar || '/default-avatar.png'"
                            class="w-6 h-6 rounded-full bg-gray-200">
                        <div class="flex-1">
                            <p class="text-sm">
                                <span class="font-semibold text-gray-800">{{ reply.author.username || 'A user' }}</span>
                                <span class="text-gray-600 ml-1">{{ reply.text }}</span>
                            </p>
                            <div class="text-xs text-gray-400 mt-1 flex items-center gap-3">
                                <span>{{ new Date(reply.created_at).toLocaleDateString() }}</span>
                                <button @click="setReplyTo(comment)"
                                    class="font-semibold hover:underline">Reply</button>
                            </div>
                        </div>
                        <button @click="toggleLike(reply)" class="flex flex-col items-center transition-colors"
                            :class="isCommentLiked(reply.id) ? 'text-brand' : 'text-gray-500 hover:text-red-400'">
                            <Icon :name="isCommentLiked(reply.id) ? 'mdi:heart' : 'mdi:heart-outline'" size="16" />
                            <span class="text-xs">{{ reply._count?.likes }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Comment Input Form -->
        <div class="p-4 border-t bg-gray-50 shrink-0">
            <div v-if="replyingToComment" class="text-xs text-gray-500 mb-2 flex justify-between items-center">
                <span>Replying to <span class="font-semibold">{{ replyingToComment.author.username }}</span></span>
                <button @click="cancelReply" class="p-1 rounded-full hover:bg-gray-200">
                    <Icon name="mdi:close" size="14" />
                </button>
            </div>
            <form @submit.prevent="postComment" class="flex items-center gap-2">
                <TextInput v-model:input="newCommentText" placeholder="Add a comment..." class="flex-1" />
                <button type="submit" :disabled="commentStore.isLoading.fetching || commentStore.isLoading.posting"
                    class="px-4 py-2 bg-brand text-white rounded-lg font-semibold text-sm disabled:opacity-70">
                    <span v-if="commentStore.isLoading.posting">Posting...</span>
                    <span v-else-if="commentStore.isLoading.fetching">Fetching...</span>
                    <span v-else>Post</span>
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useUserStore, useCommentStore, useLikeStore } from '~/stores'; // Import the new like store
import type { IProduct, IComment } from '~/models';
import TextInput from '~/components/shared/TextInput.vue';
import { notify } from '@kyvg/vue3-notification';

const props = defineProps<{
    product: IProduct;
}>();

const userStore = useUserStore();
const commentStore = useCommentStore();
const likeStore = useLikeStore(); // Initialize the like store

const newCommentText = ref('');
const replyingToComment = ref<IComment | null>(null);

const comments = computed(() => commentStore.commentsCache.get(props.product.id));
const isConnected = computed(() => commentStore.isConnected);

// A function to reactively check if a comment is liked
const isCommentLiked = (commentId: string) => {
    return likeStore.likedCommentIds.has(commentId);
};

onMounted(() => {
    commentStore.fetchComments(props.product.id);
    commentStore.subscribeToComments(props.product.id);
});

onUnmounted(() => {
    commentStore.unsubscribeFromComments();
});

const setReplyTo = (comment: IComment) => {
    replyingToComment.value = comment;
};

const cancelReply = () => {
    replyingToComment.value = null;
};

const postComment = async () => {
    if (!newCommentText.value.trim()) return;
    if (!userStore.isLoggedIn) {
        notify({ type: 'warn', text: 'You must be logged in to comment.' });
        return;
    }

    const success = await commentStore.postComment({
        productId: props.product.id,
        text: newCommentText.value,
        parentId: replyingToComment.value ? replyingToComment.value.id : null,
    });

    if (success) {
        newCommentText.value = '';
        replyingToComment.value = null;
    }
};

const toggleLike = (comment: IComment) => {
    if (!userStore.isLoggedIn) {
        notify({ type: 'warn', text: 'You must be logged in to like a comment.' });
        return;
    }
    likeStore.toggleCommentLike(comment.id);

    // Optimistically update the count for instant UI feedback
    const isLiked = isCommentLiked(comment.id);
    if (comment._count?.likes) {
        comment._count.likes += isLiked ? 1 : -1;
    }
};
</script>
