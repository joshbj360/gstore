import { useCategoryStore,useUserStore, useLikeStore, useFollowStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';  
import { onMounted, onUnmounted } from 'vue';

/**
 * A composable to fetch and cache ALL shared data required by the main application layout.
 * It uses useAsyncData with a singleton key to ensure data is fetched only once per session.
 */
export const useLayoutData = () => {
    const categoryStore = useCategoryStore();
    const apiService = useApiService();
    const userStore = useUserStore();
    const likeStore = useLikeStore();
    const followStore = useFollowStore();

    // `useAsyncData` provides a `refresh` function to re-run the async logic
    const { data, pending, error, refresh } = useAsyncData(
        'layout-data', 
        async () => {
            console.log('Fetching fresh layout data via apiService...'); // For debugging
            
            // We create an array of all the promises we need to resolve
            const promises: Promise<any>[] = [
                apiService.getTopSellers(),
                categoryStore.fetchCategories() // This action is already "smart" and has its own cache
            ];

            // If the user is logged in, add their private data
            // to the list of things we need to fetch *before* we render.
            // The `apiService` will now correctly forward the auth cookie.
            if (userStore.isLoggedIn) {
                promises.push(likeStore.fetchUserLikes());
                promises.push(followStore.fetchUserFollows());
            }

            // Promise.all runs all fetches in parallel
            const [topSellers, categories] = await Promise.all(promises);
            
            // The other promises (fetchUserLikes, fetchUserFollows) have also
            // completed, and their stores are now populated.
            
            return { topSellers, categories };
        }, {
        default: () => ({
            topSellers: [],
            categories: [],
        })
    });

    // We still set up the auto-refresh interval
    let refreshInterval: NodeJS.Timeout | null = null;
    onMounted(() => {
        refreshInterval = setInterval(() => {
            if (userStore.isLoggedIn) { // Only auto-refresh for logged-in users
                refresh();
            }
        }, 300000); // 5 minutes
    });
    onUnmounted(() => {
        if (refreshInterval) clearInterval(refreshInterval);
    });

    return { data, pending, error, refresh };
};