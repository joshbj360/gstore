<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="border border-gray-300 rounded-md overflow-hidden">
      <!-- Toolbar - Only shows when editor is ready -->
      <div v-if="editor" class="flex flex-wrap items-center gap-1 border-b border-gray-300 bg-gray-50 p-2">
        <button
          type="button"
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'bg-gray-200': editor.isActive('bold') }"
          class="p-1 rounded hover:bg-gray-200"
          title="Bold"
        >
          <Icon name="mdi:format-bold" class="w-5 h-5" />
        </button>
        <!-- Other toolbar buttons... -->
      </div>
      
      <!-- Editor Content - Only renders when editor is ready -->
      <EditorContent
        v-if="editor"
        :editor="editor"
        class="min-h-[150px] p-3 focus:outline-none"
        :class="{ 'border-red-300': error }"
      />
      <div v-else class="min-h-[150px] p-3 text-gray-400">
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
.ProseMirror {
  min-height: 150px;
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}
</style>