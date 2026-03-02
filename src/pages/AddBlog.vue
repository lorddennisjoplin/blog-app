<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">Add Post</h1>

    <div v-if="auth.user" class="card p-3 my-3 text-start">
      <!-- Success / Error Alert -->
      <div
        v-if="message && blogs.value?.length === 0"
        :class="[
          'alert py-2',
          messageType === 'success' ? 'alert-success' : 'alert-danger'
        ]"
      >
        {{ message }}
      </div>

      <form @submit.prevent="handleAddBlog">
        <input
          v-model="form.title"
          type="text"
          class="form-control mb-2"
          placeholder="Title"
          required
        />

        <div class="mb-2">
          <!-- Headings -->
          <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
          <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
          <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleHeading({ level: 4 }).run()">H4</button>

          <!-- Text styles -->
          <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleBold().run()"><strong>B</strong></button>
          <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleItalic().run()"><em>I</em></button>
          <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleStrike().run()"><s>S</s></button>

          <!-- Lists -->
          <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleBulletList().run()"><i class="bi bi-list-ul"></i></button>
          <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleOrderedList().run()"><i class="bi bi-list-ol"></i></button>
        </div>

        <EditorContent :editor="editor" class="editor-content mb-2" required />

        <input
          v-model="form.featuredImage"
          type="url"
          class="form-control mb-2"
          placeholder="Featured Image URL"
          required
        />

        <button
          type="submit"
          class="btn btn-sm btn-primary me-2"
          :disabled="adding"
        >
          <span v-if="adding">
            <span class="spinner-border spinner-border-sm me-1"></span>
            Adding...
          </span>
          <span v-else>
            Publish
          </span>
        </button>

        <button
          type="button"
          class="btn btn-sm btn-secondary me-2"
          @click="cancelForm"
          :disabled="adding"
        >
          Cancel
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../services/api.js'

// ----- User & Router -----
const auth = useUserStore()
const router = useRouter()

// ----- Form & Messages -----
const message = ref('')
const messageType = ref('success')
const adding = ref(false)

const form = reactive({
  title: '',
  content: '',          // WYSIWYG content
  featuredImage: ''
})

// ----- Blogs -----
const blogs = ref([])
const loading = ref(true)
const currentPage = ref(1)

// ----- Tiptap WYSIWYG Editor -----
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const editor = new Editor({
  extensions: [StarterKit],
  content: '',
  onUpdate({ editor }) {
    form.content = editor.getHTML()
  }
})

// Destroy editor instance on unmount
onBeforeUnmount(() => {
  editor.destroy()
})

// ----- Add Blog -----
const handleAddBlog = async () => {
  try {
    adding.value = true

    // Send blog data to backend
    const res = await api.post('/blogs/add', form, {
      headers: { Authorization: `Bearer ${auth.token}` }
    });

    const newBlog = res.data; // <--- assign server response to newBlog

    message.value = 'Blog added successfully. Redirecting...'
    messageType.value = 'success'
    setTimeout(() => message.value = '', 4000)

    // Redirect after 3 seconds
    setTimeout(() => {
      router.push(`/blogs/post/${newBlog._id}`);
    }, 3000);

  } catch (err) {
    message.value = err.response?.data?.message || err.message
    messageType.value = 'error'
  } finally {
    adding.value = false
  }
}

// ----- Cancel Form -----
const cancelForm = () => {
  Object.assign(form, {
    title: '',
    content: '',
    featuredImage: ''
  })
  editor.commands.clearContent()
}

// ----- Navigation -----
const goToBlog = (id) => router.push(`/blogs/blog/${id}`)

// ----- Mounted -----
onMounted(async () => {
  if (auth.token && !auth.user) {
    try {
      const res = await api.get("/users/details", {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      auth.setUser(res.data.user)

      console.log(res.data.user)

    } catch (err) {
      console.error("Failed to fetch user:", err)
    }
  }
})
</script>

<style>
/* Optional: set min-height for editor */
.editor-content {
  min-height: 150px;
}

.editor-content {
  min-height: 150px;
  border: 1px solid #ced4da;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

/* Tiptap uses ProseMirror */
/* Make the inner editable div fill the container */
.ProseMirror {
  min-height: 150px !important;        /* initial height */
  outline: none !important;
  box-shadow: none !important;
  /*border: 1px solid #ced4da;*/
  border-radius: 0.25rem;
  padding: 0.5rem;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
</style>