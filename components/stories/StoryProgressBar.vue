<template>
    <div class="absolute top-0 left-0 right-0 z-20 p-2">
        <div class="flex gap-1">
            <div v-for="(story, index) in stories" :key="story.id" class="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                    class="h-full bg-white rounded-full transition-all duration-300"
                    :style="{ width: getProgress(index) }"
                ></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { IStory } from '~/models';

const props = defineProps<{
    stories: IStory[];
    currentIndex: number;
    progress: number; // A value from 0 to 100
}>();

const getProgress = (index: number) => {
    if (index < props.currentIndex) return '100%';
    if (index === props.currentIndex) return `${props.progress}%`;
    return '0%';
};
</script>
