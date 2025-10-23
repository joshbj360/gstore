import { useCategoryStore} from '~/stores';
import { useApiService } from '~/services/api/apiService';

export const useLayoutData = () => {
    const categoryStore = useCategoryStore();
    const apiService = useApiService();

    // `useAsyncData` provides a `refresh` function to re-run the async logic
    const { data, pending, error, refresh } = useAsyncData(
        'layout-data', 
        async () => {
            console.log('Fetching fresh layout data...'); // For debugging
            const [topSellers, categories] = await Promise.all([
                apiService.getTopSellers(),
                categoryStore.fetchCategories()
            ]);
            return { topSellers, categories };
        }, {
        default: () => ({
            topSellers: [],
            categories: [],
        })
    });

    // THE FIX: Return the `refresh` function along with the data.
    return { data, pending, error, refresh };
};