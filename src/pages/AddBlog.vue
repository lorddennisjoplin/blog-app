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

          <!-- Links -->
          <button type="button" class="btn btn-sm btn-outline-secondary me-1"
            @click="addLink"
          >
            🔗 Link
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary me-1"
            @click="editor.chain().focus().unsetLink().run()"
          >
            ❌ Link
          </button>

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
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useEditor, EditorContent } from '@tiptap/vue-3'

const editor = useEditor({
  extensions: [
    StarterKit.configure({ link: false }),
    Link.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        target: '_blank',
        rel: 'nofollow ugc noopener',
      },
    }),
  ],
  content: '',
  onUpdate({ editor }) {
    // Sync the editor content into your reactive form
    form.content = editor.getHTML()
  },
})

// ----- Add Link -----
const addLink = () => {
  if (!editor.value) return
  const url = window.prompt('Enter URL')
  if (!url) return

  editor.value.chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url, target: '_blank', rel: 'nofollow ugc noopener' })
    .run()
}

// ----- Cancel Form -----
const cancelForm = () => {
  Object.assign(form, {
    title: '',
    content: '',
    featuredImage: ''
  })

  // Clear editor content safely
  editor.value?.commands.clearContent()

  // Navigate to user's posts
  if (auth.user?.username) {
    router.push(`/posts/user/${auth.user.username}`)
  } else {
    router.push('/posts/all')
  }
}

const handleAddBlog = async () => {
  if (!form.content || !form.title) {
    message.value = "Title and content cannot be empty."
    messageType.value = 'error'
    return
  }

  try {
    adding.value = true
    const res = await api.post('/posts/add', form, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    const newBlog = res.data

    message.value = 'Blog added successfully. Redirecting...'
    messageType.value = 'success'

    setTimeout(() => {
      router.push(`/posts/view/${newBlog._id}`)
    }, 1500)

  } catch (err) {
    message.value = err.response?.data?.message || err.message
    messageType.value = 'error'
  } finally {
    adding.value = false
  }
}

// ----- Navigation -----
const goToBlog = (id) => router.push(`/posts/view/${id}`)

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

// ----- Unmount -----
onBeforeUnmount(() => {
  editor.value?.destroy()
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
  min-height: 150px !important;
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