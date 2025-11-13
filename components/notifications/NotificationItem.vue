<template>
    <NuxtLink :to="notificationLink" class="flex items-start p-4 gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors border-b border-gray-100 dark:border-neutral-800">
        <Icon :name="iconName" size="24" class="text-neutral-400" :class="iconColorClass" />
        <div class="flex-1">
            <img v-if="notification.actor" :src="notification.actor.avatar || formatAvatarUrl(notification.actor.username)" class="w-8 h-8 rounded-full mb-2" />
            <p class="text-sm text-gray-800 dark:text-neutral-200">
                <span v-if="notification.actor" class="font-semibold">{{ notification.actor.username }}</span>
                {{ notification.message }}
            </p>
            <time class="text-xs text-gray-500 dark:text-neutral-500 mt-1">{{ new Date(notification.created_at).toLocaleString() }}</time>
        </div>
        <span v-if="!notification.read" class="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2"></span>
    </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { INotification } from '~/models';

const props = defineProps<{ notification: INotification }>();

const iconName = computed(() => {
    switch(props.notification.type) {
        case 'NEW_FOLLOWER': return 'mdi:account-plus';
        case 'POST_LIKE': return 'mdi:heart';
        case 'COMMENT_LIKE': return 'mdi:heart';
        case 'NEW_COMMENT': return 'mdi:comment-text';
        case 'REPLY': return 'mdi:comment-arrow-left';
        case 'ORDER': return 'mdi:package-variant-closed';
        default: return 'mdi:bell';
    }
});

const iconColorClass = computed(() => {
    switch(props.notification.type) {
        case 'NEW_FOLLOWER': return '!text-blue-400';
        case 'POST_LIKE': return '!text-brand-light';
        case 'COMMENT_LIKE': return '!text-brand-light';
        case 'NEW_COMMENT': return '!text-green-400';
        case 'REPLY': return '!text-green-400';
        case 'ORDER': return '!text-indigo-400';
        default: return 'text-neutral-400';
    }
});

// Create a link based on the notification type
const notificationLink = computed(() => {
    if (props.notification.orderId) return `/sellers/dashboard?tab=orders`;
    if (props.notification.productId) return `/product/${props.notification.product?.slug}`;
    if (props.notification.actorId) return `/profile/${props.notification.actor?.username}`;
    return '#';
});
</script>
