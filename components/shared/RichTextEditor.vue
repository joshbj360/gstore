<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-neutral-300">
      {{ label }}
      <span v-if="required" class="text-brand">*</span>
    </label>
     
    <div class="border border-gray-300 dark:border-neutral-700 rounded-lg overflow-hidden">
      <div v-if="editor" class="flex flex-wrap items-center gap-1 border-b border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 p-2">
        <button
          type="button"
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'bg-gray-200 dark:bg-neutral-700': editor.isActive('bold') }"
          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700"
          title="Bold"
        >
          <Icon name="mdi:format-bold" class="w-5 h-5" />
        </button>
        </div>
      
      <EditorContent
        v-if="editor"
        :editor="editor"
        class="min-h-[150px] p-3 focus:outline-none bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
        :class="{ 'border-red-300': error }"
      />
      <div v-else class="min-h-[150px] p-3 text-gray-400 dark:text-neutral-500">
        Loading editor...
      </div>
    </div>
    
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: '' 
  },
  required: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

// Initialize as undefined - will be set in onMounted
const editor = ref<Editor>();

// Initialize editor safely
onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        // This adds the placeholder text
        'data-placeholder': 'Write your product description...',
      },
    },
    onUpdate: () => {
      emit('update:modelValue', editor.value?.getHTML() || '');
    },
  });
});

// Cleanup editor safely
onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Watch for modelValue changes
watch(() => props.modelValue, (newValue) => {
  const isSame = editor.value?.getHTML() === newValue;
  if (!isSame) {
    editor.value?.commands.setContent(newValue, false);
  }
});
</script>

<style>
/* THE FIX: These global styles are now theme-aware */
.ProseMirror {
  min-height: 150px;
  outline: none;
}

/* Light mode placeholder */
html:not(.dark) .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af; /* gray-400 */
  pointer-events: none;
  height: 0;
}

/* Dark mode placeholder */
.dark .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #737373; /* neutral-500 */
  pointer-events: none;
  height: 0;
}
</style>