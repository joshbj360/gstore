<template>
  <div class="space-y-6">
    <div class="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
      <h3 class="font-semibold text-gray-800 dark:text-neutral-200">Connect Your Socials</h3>
      <p class="text-sm text-gray-500 dark:text-neutral-400 mb-4">Connect once, post everywhere. This will be your Social CMS.</p>
      
      <!-- List of platforms to connect to -->
      <div class="flex flex-col sm:flex-row gap-4">
        <button 
          v-for="platform in platformsToConnect" 
          :key="platform.id" 
          @click="connect(platform.id)"
          class="social-connect-btn"
        >
          <Icon :name="platform.icon" :class="platform.iconColor" size="20" /> 
          Connect {{ platform.name }}
        </button>
      </div>
      
      <div v-if="platformsToConnect.length === 0" class="text-sm text-green-600 dark:text-green-400 font-medium">
        All platforms connected!
      </div>
    </div>

    <template v-for="platform in socialPlatforms" :key="platform.id">
      <div v-if="platform.connected" class="space-y-2">
          <div class="flex justify-between items-center mb-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-neutral-300">
                Caption for <Icon :name="platform.icon" :class="platform.iconColor" /> {{ platform.name }}
              </label>
              <button 
                  type="button" 
                  @click="generateCaption(platform.id)" 
                  :disabled="isGenerating[platform.id] || !productInfo.description"
                  class="text-xs font-semibold text-brand hover:text-brand-dark flex items-center gap-1 disabled:opacity-50"
              >
                  <Icon v-if="isGenerating[platform.id]" name="eos-icons:loading" />
                  <Icon v-else name="mdi:creation" />
                  {{ isGenerating[platform.id] ? 'Generating...' : 'Generate Caption' }}
              </button>
          </div>
          <textarea v-model="platform.caption" rows="4" class="form-input" :placeholder="`Your ${platform.name} post will appear here...`"></textarea>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useApiService } from '~/services/api/apiService';
import { notify } from '@kyvg/vue3-notification';

// THE FIX: The prop now expects the tags array
const props = defineProps<{
  productInfo: {
    title: string;
    description: string;
    price: number | null;
    tags: string[]; // <-- Added this
  }
}>();

const emit = defineEmits(['update:captions']);

const apiService = useApiService();

const socialPlatforms = reactive([
  { id: 'instagram', name: 'Instagram', icon: 'mdi:instagram', iconColor: 'text-pink-500', caption: '', connected: false },
  { id: 'facebook', name: 'Facebook', icon: 'mdi:facebook', iconColor: 'text-blue-600', caption: '', connected: false },
  { id: 'twitter', name: 'Twitter', icon: 'mdi:twitter', iconColor: 'text-blue-400', caption: '', connected: false },
]);

const isGenerating = reactive<Record<string, boolean>>({
  instagram: false,
  facebook: false,
  twitter: false,
});

const platformsToConnect = computed(() => {
  return socialPlatforms.filter(p => !p.connected);
});

const connect = async (platformId: string) => { 
  notify({ type: 'info', text: `Connecting to ${platformId} (demo)...` });
  const p = socialPlatforms.find(p => p.id === platformId);
  if (p) p.connected = true;
};

const generateCaption = async (platformId: string) => {
  isGenerating[platformId] = true;
  try {
    // THE FIX: We now pass the entire productInfo object, including tags
    const res = await apiService.aiGeneratePlatformCaption(platformId, props.productInfo);
    
    const p = socialPlatforms.find(p => p.id === platformId);
    if (p) p.caption = res.caption;
  } catch (e: any) {
    notify({ type: 'error', text: e.message || 'AI failed.' });
  } finally {
    isGenerating[platformId] = false;
  }
};

// Watch for changes in captions and emit them to the parent
watch(socialPlatforms, (newValue) => {
  const connectedCaptions = newValue
    .filter(p => p.connected && p.caption)
    .reduce((acc, p) => {
      acc[p.id] = p.caption;
      return acc;
    }, {} as Record<string, string>);
  
  emit('update:captions', connectedCaptions);
}, { deep: true });

</script>

<style scoped>
.form-input { 
  @apply mt-1 block w-full border border-gray-300 dark:border-neutral-700 rounded-lg shadow-sm py-2 px-3 
         bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100
         focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent; 
}
.social-connect-btn {
  @apply flex-1 p-3 rounded-lg bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50;
}
</style>