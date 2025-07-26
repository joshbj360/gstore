```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-800">Processing...</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useUserStore } from '~/stores/user.store';
import { useRouter } from 'vue-router';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const userStore = useUserStore();
const router = useRouter();

onMounted(async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    console.error('Error fetching session:', error?.message);
    router.push('/auth/login');
    return;
  }
  await userStore.fetchUserAndProfile()
  router.push('/');
});
</script>
```