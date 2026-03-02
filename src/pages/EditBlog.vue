<template>
  <div class="container my-5">

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading blog post...
    </div>

    <div v-else>
      <!-- OWNER EDIT FORM -->
      <div v-if="isOwner && isEditRoute">
        <h1 class="mb-3">Edit Your Post</h1>

        <div
          v-if="message"
          :class="['alert py-2', messageType === 'success' ? 'alert-success' : 'alert-danger']"
        >
          {{ message }}
        </div>

        <form @submit.prevent="handleEditBlog">
          <input
            v-model="form.title"
            type="text"
            class="form-control mb-3"
            placeholder="Title"
            required
          />

          <!-- Tiptap Toolbar -->
          <div v-if="editor" class="mb-2">
            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleHeading({ level: 4 }).run()">H4</button>

            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleBold().run()"><strong>B</strong></button>
            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleItalic().run()"><em>I</em></button>
            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleStrike().run()"><s>S</s></button>

            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="addLink">🔗 Link</button>
            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().unsetLink().run()">❌ Link</button>

            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleBulletList().run()"><i class="bi bi-list-ul"></i></button>
            <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="editor.chain().focus().toggleOrderedList().run()"><i class="bi bi-list-ol"></i></button>
          </div>

          <div v-if="editor" class="border rounded p-3 mb-3">
            <EditorContent :editor="editor" />
          </div>

          <input
            v-model="form.featuredImage"
            type="url"
            class="form-control mb-3"
            placeholder="Featured Image URL"
            required
          />

          <button class="btn btn-primary me-2" :disabled="editing">
            <span v-if="editing">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Saving...
            </span>
            <span v-else>Save Changes</span>
          </button>

          <button type="button" class="btn btn-secondary" @click="router.push(`/posts/view/${route.params.id}`)">
            Cancel
          </button>
        </form>
      </div>

      <!-- VIEW MODE -->
      <div v-else-if="blog" class="row mt-3">
        <div class="col-lg-9 col-12">
          <h1 class="mb-2">{{ blog.title }}</h1>
          <p class="fw-bold text-muted mb-2">
            By
            <RouterLink 
                    v-if="blog.author?.username" 
                    :to="`/posts/user/${blog.author.username}`" 
                    class="text-decoration-none fw-bold"
                  >
                  {{ blog.author?.username || 'Unknown' }}
                  </RouterLink>
            &bull; {{ formattedDate }}
            <span v-if="isOwner" class="ms-2">
              &bull;
              <a href="#" @click.prevent="editBlog(blog._id)" class="text-warning text-decoration-none ms-2">Edit Post</a>
            </span>
          </p>

          <hr>

          <img
            v-if="blog.featuredImage"
            :src="blog.featuredImage"
            class="img-fluid rounded mb-4"
            style="width: 100%;"
          />

          <div v-html="blog.content" class="mb-3"></div>

          <!-- Comments Section -->
          <div class="my-5">
            <hr class="mb-5">
            <h2 class="mb-3" id="comments">Comments</h2>

            <div v-if="auth.token" class="mb-4">
              <form @submit.prevent="submitComment">
                <div class="mb-2">
                  <textarea v-model="newComment" class="form-control" rows="3" placeholder="Write a comment..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary mt-2" :disabled="submittingComment">
                  <span v-if="submittingComment">
                    <span class="spinner-border spinner-border-sm me-1"></span>
                    Posting...
                  </span>
                  <span v-else>Post Comment</span>
                </button>
              </form>
            </div>
            <div v-else class="text-muted mb-4">
              <p>Please log in to post a comment.</p>
            </div>

            <div v-if="comments.length > 0">
              <div v-for="(comment, index) in comments" :key="comment._id || index" class="border rounded p-3 mb-2 bg-info">
                <p class="mb-1">
                  <RouterLink
                    v-if="comment.userId?.username"
                    :to="`/posts/user/${comment.userId.username}`"
                    class="text-decoration-none fw-bold"
                  >
                    {{ comment.userId.username }}
                  </RouterLink>

                  <strong v-else>Unknown</strong>
                  <small class="text-muted ms-2">{{ formatDate(comment.createdAt) || 'Unknown Date' }}</small>
                </p>
                <p class="mb-0">{{ comment.comment }}</p>

                <p v-if="auth.isAdmin" class="mt-3 mb-0">
                  <a href="#" class="text-danger text-decoration-none" @click.prevent="deleteComment(comment._id)">
                    Delete
                  </a>
                </p>
              </div>
            </div>
            <div v-else class="text-muted">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-3 col-12">
          <div class="border p-3" style="min-height: 500px;">
            <p class="text-muted">Sidebar reserved space</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../services/api.js'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

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
const submittingComment = ref(false)

// Form (reactive)
const form = reactive({
  title: '',
  content: '',
  featuredImage: ''
})

const scrollToHash = async (hash) => {
  if (!hash) return
  await nextTick() // wait for DOM update
  const el = document.querySelector(hash)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

watch(() => route.hash, (newHash) => scrollToHash(newHash))

watch(blog, async (newBlog) => {
  if (newBlog) {
    await nextTick()
    scrollToHash(route.hash)
  }
})

// Editor
const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { target: '_blank', rel: 'nofollow ugc noopener' }
    })
  ],
  content: '',
  onUpdate: ({ editor }) => {
    form.content = editor.getHTML() // reactive assignment
  }
})

// Add link
const addLink = () => {
  const url = window.prompt('Enter URL')
  if (url && editor.value) {
    editor.value.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url, target: '_blank', rel: 'nofollow ugc noopener' })
      .run()
  }
}

// Computed
const isEditRoute = computed(() => route.path.includes('/edit/'))
const isOwner = computed(() =>
  auth.user && blog.value && blog.value.author && blog.value.author._id === auth.user._id
)
const formattedDate = computed(() => {
  if (!blog.value?.createdAt) return ''
  return new Date(blog.value.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
})

// Simple date formatter
const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) // e.g., "02 Mar 2026"
}

// Load blog
const loadBlog = async (id) => {
  loading.value = true
  try {
    const res = await api.get(`/posts/view/${id}`)
    blog.value = res.data.blog

    // **Assign directly, do not use .value**
    form.title = blog.value.title
    form.content = blog.value.content
    form.featuredImage = blog.value.featuredImage

    if (editor.value) editor.value.commands.setContent(blog.value.content || '')

    // Fetch comments after loading blog
    fetchComments(id)

  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadBlog(route.params.id))
watch(() => route.params.id, (newId) => { if (newId) loadBlog(newId) })
onBeforeUnmount(() => { if (editor.value) editor.value.destroy() })

// Navigation
const editBlog = (id) => router.push(`/posts/edit/${id}`)

// Save updates
const handleEditBlog = async () => {
  try {
    editing.value = true
    const res = await api.patch(`/posts/edit/${route.params.id}`, form)

    message.value = "Blog updated successfully. Redirecting..."
    messageType.value = "success"

    setTimeout(() => {
      message.value = ''
      messageType.value = ''
    }, 2000)

    if (res.data.updatedBlog) {
      blog.value = res.data.updatedBlog
      form.title = blog.value.title
      form.content = blog.value.content
      form.featuredImage = blog.value.featuredImage

      if (editor.value) editor.value.commands.setContent(blog.value.content || '')
    }

    setTimeout(() => {
      router.push(`/posts/view/${route.params.id}`)
    }, 2000)

  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || "Failed to update blog."
    messageType.value = "error"
  } finally {
    editing.value = false
  }
}

// ----- Comments -----
const comments = ref([])
const newComment = ref('')

const fetchComments = async (postId) => {
  try {
    const res = await api.get(`/posts/getComments/${postId}`)

    comments.value = (res.data.comments || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  } catch (err) {
    console.error('Failed to fetch comments:', err)
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return

  try {
    submittingComment.value = true

    const res = await api.post(
      `/posts/addComment/${blog.value._id}`,
      { comment: newComment.value },
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )

    // Add to the top
    comments.value.unshift(res.data.comment)
    newComment.value = ''

  } catch (err) {
    console.error('Failed to post comment:', err)
  } finally {
    submittingComment.value = false
  }
}
// Delete a comment (admin only)
const deleteComment = async (commentId) => {
  if (!confirm("Are you sure you want to delete this comment?")) return

  try {
    await api.delete(`/posts/deleteComment/${commentId}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })

    // Remove from local comments array
    comments.value = comments.value.filter(c => c._id !== commentId)
  } catch (err) {
    console.error("Failed to delete comment:", err)
    alert(err?.response?.data?.message || "Failed to delete comment")
  }
}

watch(
  blog,
  (newBlog) => {
    if (newBlog && newBlog.title) {
      document.title = `${newBlog.title} | Blog App`
    } else {
      document.title = "Loading... | Blog App"
    }
  },
  { immediate: true }
)
</script>