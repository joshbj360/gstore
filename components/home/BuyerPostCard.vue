<template>
    <div class="bg-white dark:bg-neutral-950 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-neutral-800">
        <div class="flex items-center p-3">
            <NuxtLink :to="`/profile/${item.author.username}`" class="flex items-center gap-3">
                <img :src="item.author?.avatar || `https://avatar.iran.liara.run/public/boy?username=${item.author?.username}`" class="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-neutral-800">
                <div>
                    <span class="font-semibold text-sm text-gray-900 dark:text-neutral-100">{{ item.author?.username }}</span>
                    <span class="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">Buyer Post</span>
                </div>
            </NuxtLink>
            <button @click.stop="followStore.toggleFollow(item.author.id)" class="ml-auto text-sm font-semibold hover:underline"
                 :class="isFollowing ? 'text-gray-500 dark:text-neutral-400' : 'text-brand'">
                {{ isFollowing ? 'Following' : 'Follow' }}
            </button>
        </div>

        <div class="relative aspect-video bg-gray-100 dark:bg-neutral-800">
            <FeedMediaDisplay :media="item.media" :alt-text="item.caption || 'Buyer post'" class="w-full h-full" />
        </div>

        <div class="p-4">
            <div class="flex items-center space-x-4 mb-3">
                <button @click.stop="likeStore.togglePostLike(item.id)">
                     <Icon :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" class="w-7 h-7" :class="isLiked ? 'text-brand-dark' : 'text-gray-500 dark:text-neutral-300 hover:text-brand-light'" />
                </button>
                <button @click.stop="$emit('open-comments', item)">
                    <Icon name="mdi:comment-text-outline" class="w-7 h-7 text-gray-500 dark:text-neutral-300 hover:text-black dark:hover:text-white" />
                 </button>
                <button @click.stop="sharePost">
                    <Icon name="mdi:share-variant-outline" class="w-7 h-7 text-gray-500 dark:text-neutral-300 hover:text-black dark:hover:text-white" />
                </button>
                 <div class="flex-1"></div>
                <button v-if="item.taggedProducts.length > 0" @click.stop="$emit('open-details', item.taggedProducts[0])" title="View tagged products..." class="ml-auto p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
                    <Icon name="mdi:dots-horizontal-circle-outline" class="w-7 h-7 text-gray-500 dark:text-neutral-300" />
                </button>
            </div>
             
            <div class="text-sm">
                <p class="font-semibold text-gray-800 dark:text-neutral-100">{{ likeCountFormatted }} likes</p>
                <p class="text-gray-800 dark:text-neutral-100">
                     <span class="font-semibold">{{ item.author?.username }}</span>
                    <span class="text-gray-600 dark:text-neutral-300 ml-2 line-clamp-2">{{ item.caption }}</span>
                </p>
            </div>

            <div v-if="item.taggedProducts.length > 0" class="mt-3">
                <NuxtLink :to="`/product/${item.taggedProducts[0].slug}`" class="flex items-center gap-2 p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                    <Icon name="mdi:tag-outline" class="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                    <span class="text-xs font-semibold text-gray-700 dark:text-neutral-200 truncate">
                         View tagged product: {{ item.taggedProducts[0].title }}
                    </span>
                    <Icon name="mdi:chevron-right" class="w-4 h-4 text-gray-400 dark:text-neutral-500 ml-auto shrink-0" />
                </NuxtLink>
             </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLikeStore, useUserStore, useFollowStore } from '~/stores';
import type { IFeedItem,  } from '~/models'; // Use the IReel interface
import { notify } from '@kyvg/vue3-notification';
import FeedMediaDisplay from '~/components/home/FeedMediaDisplay.vue';

const props = defineProps<{ item: IFeedItem }>();
const emit = defineEmits(['open-comments', 'open-details']);

const likeStore = useLikeStore();
const userStore = useUserStore();
const followStore = useFollowStore();

const isLiked = computed(() => likeStore.likedPostIds.has(props.item.id!));
const isFollowing = computed(() => followStore.followedSellerIds.has(props.item.author.id));

const likeCountFormatted = computed(() => {
    const baseLikes = props.item.likeCount || 0;
    // This provides an optimistic update for the like count
    if (isLiked.value) {
        return baseLikes + 1; // This logic should be refined with the user's original like status
    }
    return baseLikes;
});

const sharePost = async () => {
     const shareUrl = `${window.location.origin}/post/${props.item.id}`
    try {
        if (navigator.share) {
            await navigator.share({ url: shareUrl, title: props.item.caption || 'Check out this post' })
        } else {
            await navigator.clipboard.writeText(shareUrl)
            notify({ type: 'success', text: 'Link copied to clipboard!' })
         }
    } catch (error) {
        notify({ type: 'error', text: 'Failed to share post.' })
    }
}
</script>