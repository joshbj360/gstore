<template>
    <transition enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-200 ease-in" enter-from-class="-translate-x-full"
        leave-to-class="-translate-x-full">
        <div v-if="isOpen" class="fixed top-0 left-0 h-full z-30 flex" role="dialog" aria-modal="true">
            <div @click.stop
                class="bg-white dark:bg-neutral-900 w-screen sm:w-96 shadow-xl flex flex-col border-r border-gray-200 dark:border-neutral-800">
                <div
                    class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                        Notifications
                    </h2>
                    <button @click="$emit('close')"
                        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                        <Icon name="mdi:close" size="22" class="text-gray-600 dark:text-neutral-300" />
                    </button>
                </div>

                <div v-if="notificationStore.isLoading" class="flex-1 flex items-center justify-center">
                    <Icon name="eos-icons:loading" size="32" class="text-brand" />
                </div>
                <div v-else-if="notificationStore.notifications.length === 0"
                    class="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 dark:text-neutral-500">
                    <Icon name="mdi:bell-off-outline" size="48" class="mb-4" />
                    <p>No notifications yet.</p>
                </div>

                <div v-else class="flex-1 overflow-y-auto">
                    <NotificationItem v-for="notification in notificationStore.notifications" :key="notification.id"
                        :notification="notification" />
                </div>

                <div class="p-2 border-t border-gray-200 dark:border-neutral-800">
                    <button @click="notificationStore.markAllAsRead()"
                        class="w-full text-center text-sm font-medium text-brand hover:underline p-2">
                        Mark all as read
                    </button>
                </div>
            </div>
            <!-- Click-outside area to close the overlay -->
            <div class="flex-1" @click="$emit('close')"></div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { useNotificationStore } from '~/stores';
import NotificationItem from '~/components/notifications/NotificationItem.vue';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);

const notificationStore = useNotificationStore();

// When the panel opens, fetch the notifications
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        notificationStore.fetchNotifications();
    }
});
</script>
