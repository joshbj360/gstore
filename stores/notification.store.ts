import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { INotification } from '~/models';
import { useSupabaseClient } from '#imports';
import { notify } from '@kyvg/vue3-notification';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as INotification[],
    unreadCount: 0,
    isLoading: false,
  }),
  actions: {
    /**
     * Fetches all notifications for the user.
     */
    async fetchNotifications() {
      if (this.isLoading) return;
      this.isLoading = true;
      try {
        const apiService = useApiService();
        const data = await apiService.getNotifications();
        this.notifications = data.notifications;
        this.unreadCount = data.unreadCount;
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Listens for new, incoming notifications in real-time.
     */
    listenForNotifications(userId: string) {
      const supabase = useSupabaseClient();
      supabase
        .channel('public:Notification')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'Notification', 
            filter: `userId=eq.${userId}` 
        }, 
        (payload) => {
            const newNotification = payload.new as INotification;
            // Add the new notification to the top of the list
            this.notifications.unshift(newNotification);
            this.unreadCount++;
            // Show a toast
            notify({ type: 'success', text: newNotification.message || 'You have a new notification!' });
        })
        .subscribe();
    },

    /**
     * Marks all notifications as read.
     */
    async markAllAsRead() {
        this.unreadCount = 0;
        // In a real app, you would also call an API endpoint here
        // to update the `read: true` status in the database.
        // await apiService.markNotificationsAsRead();
    }
  }
});
