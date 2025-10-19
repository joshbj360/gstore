import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { IMedia, IStory } from '~/models'; // Assuming you create an IStory interface
import { notify } from '@kyvg/vue3-notification';

export const useStoryStore = defineStore('story', {
  state: () => ({
    // This holds the currently active story feed (e.g., for the swipe viewer)
    activeFeed: [] as IStory[],
    // NEW: A dedicated cache for the stories shown on the homepage
    homepageStories: [] as IStory[],
    // A cache for full feeds, keyed by the initial story ID
    feedCache: new Map<string, IStory[]>(),
    isLoading: false,
  }),

  actions: {
    /**
     * NEW ACTION: Sets the homepage stories from data fetched by the page.
     * This is a "setter" action, it does not fetch data itself.
     */
    setHomepageStories(stories: IStory[]) {
      this.homepageStories = stories;
    },

    /**
     * Fetches a full story feed centered around a specific story ID.
     * It uses a cache to avoid re-fetching data for the same feed.
     */
    async fetchStoryFeed(storyId: string): Promise<IStory[]> {
      console.log(this.feedCache);
      if (this.feedCache.has(storyId)) {
        const cachedFeed = this.feedCache.get(storyId)!;
        this.activeFeed = [...cachedFeed];
        return cachedFeed;
      }

      this.isLoading = true;
      try {
        const apiService = useApiService();
        const feed  = await apiService.fetchStory(storyId);
        console.log('story feed result, from store', feed)
        this.feedCache.set(storyId, feed); // Cache the new feed (feed should be IStory[])
        this.activeFeed = [...feed];
        return feed;
      } catch (error) {
        console.error(`Failed to fetch story feed for ID ${storyId}:`, error);
        notify({ type: 'error', text: 'Could not load stories.' });
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Creates a new story.
     */
    async createStory(payload: { media: object; productId?: number | null }): Promise<boolean> {
      this.isLoading = true;
      try {
        const apiService = useApiService();
        await apiService.createStory(payload);
        notify({ type: 'success', text: 'Story posted successfully!' });
        // You might want to invalidate or update homepage data here
        return true;
      } catch (error: any) {
        notify({ type: 'error', text: error.data?.message || 'Failed to post story.' });
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

// Note: Deletion of stories is handled by a server-side cron job, so no client-side action is needed.