<template>
  <div class="container my-5">

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading blog post...
    </div>

    <div v-else>

      <!-- OWNER //-->
      <div v-if="isOwner && isEditRoute" class="card p-4 mt-3">
        <h1 class="mb-3">Edit Post</h1>

        <div
          v-if="message"
          :class="[
            'alert py-2',
            messageType === 'success' ? 'alert-success' : 'alert-danger'
          ]"
        >
          {{ message }}
        </div>

        <form @submit.prevent="handleEditBlog">

          <!-- Title -->
          <input
            v-model="form.title"
            type="text"
            class="form-control mb-3"
            placeholder="Title"
            required
          />

          <!-- Tiptap Toolbar -->
          <div v-if="editor" class="mb-2">
            <button type="button" class="btn btn-sm btn-outline-secondary me-1"
              @click="editor.chain().focus().toggleBold().run()">
              Bold
            </button>

            <button type="button" class="btn btn-sm btn-outline-secondary me-1"
              @click="editor.chain().focus().toggleItalic().run()">
              Italic
            </button>

            <button type="button" class="btn btn-sm btn-outline-secondary me-1"
              @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
              H2
            </button>

            <button type="button" class="btn btn-sm btn-outline-secondary"
              @click="editor.chain().focus().toggleBulletList().run()">
              List
            </button>
          </div>

          <!-- Tiptap Editor -->
          <div v-if="editor" class="border rounded p-3 mb-3">
            <EditorContent :editor="editor" />
          </div>

          <!-- Featured Image -->
          <input
            v-model="form.featuredImage"
            type="url"
            class="form-control mb-3"
            placeholder="Featured Image URL"
            required
          />

          <!-- Buttons -->
          <button class="btn btn-primary btn-sm me-2" :disabled="editing">
            <span v-if="editing">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Saving...
            </span>
            <span v-else>
              Save Changes
            </span>
          </button>

          <button
            type="button"
            class="btn btn-secondary btn-sm"
            @click="router.push(`/blogs/post/${route.params.id}`)"
          >
            Cancel
          </button>

        </form>
      </div>

      <!-- VIEW MODE //-->
      <div v-else-if="blog" class="card shadow-sm p-4 mt-3 col-md-8 mx-auto">

        <h1 class="card-title mb-2">{{ blog.title }}</h1>

        <p class="fw-bold text-muted mb-2">
          By {{ blog.author?.username || 'Unknown' }}
          &bull;
          {{ formattedDate }}
        </p>

        <a
          v-if="isOwner"
          href="#"
          @click.prevent="editBlog(blog._id)"
          class="text-warning text-decoration-none"
        >
          Edit Post
        </a>

        <hr>

        <img
          v-if="blog.featuredImage"
          :src="blog.featuredImage"
          class="img-fluid rounded mb-4"
          style="width: 100%;"
        />

        <div class="card-text mb-3" v-html="blog.content"></div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../services/api.js'

import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

// Router & Store
const route = useRoute()
const router = useRouter()
const auth = useUserStore()

// State
const blog = ref(null)
const loading = ref(true)
const editing = ref(false)
const message = ref('')
const messageType = ref('')

// Form
const form = reactive({
  title: '',
  content: '',
  featuredImage: ''
})

// Tiptap
const editor = useEditor({
  extensions: [StarterKit],
  content: '',
  onUpdate: ({ editor }) => {
    form.content = editor.getHTML()
  }
})

// Computed
const isEditRoute = computed(() =>
  route.path.includes('/edit/')
)

const isOwner = computed(() =>
  auth.user &&
  blog.value &&
  blog.value.author &&
  blog.value.author._id === auth.user._id
)

const formattedDate = computed(() => {
  if (!blog.value?.createdAt) return ''
  const date = new Date(blog.value.createdAt)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
})

// Load blog
const loadBlog = async (id) => {
  loading.value = true
  try {
    const res = await api.get(`/blogs/post/${id}`)
    blog.value = res.data.blog

    Object.assign(form, res.data.blog)

    if (editor.value) {
      editor.value.commands.setContent(res.data.blog.content || '')
    }

  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBlog(route.params.id)
})

watch(() => route.params.id, (newId) => {
  if (newId) loadBlog(newId)
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// Navigation
const editBlog = (id) => {
  router.push(`/blogs/edit/${id}`)
}

// Save
const handleEditBlog = async () => {
  try {
    editing.value = true

    await api.patch(`/blogs/edit/${route.params.id}`, form)

    message.value = "Blog updated successfully."
    messageType.value = "success"

    setTimeout(() => {
      router.push("/blogs")
    }, 1500)

  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || "Failed to update blog."
    messageType.value = "error"
  } finally {
    editing.value = false
  }
}
</script>