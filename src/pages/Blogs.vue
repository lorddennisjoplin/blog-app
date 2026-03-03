<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">{{pageTitle}}</h1>

    <div class="row">
      <!-- Main content: 80% -->
      <div class="col-md-9">
        <div v-if="loading" class="alert alert-info py-2">Loading posts...</div>

        <div v-else>
          <div v-if="blogs.length === 0" class="alert alert-warning py-2">
            <template v-if="isUserPage">
              No posts found for this user.
            </template>
            <template v-else>
              No posts found.
            </template>
          </div>
          <div v-else>
            <div v-for="blog in blogs" :key="blog._id" class="row mb-3 align-items-center">
              <!-- Text column: full width on small screens -->
              <div class="col-12 col-lg-8 d-flex flex-column justify-content-between">
                <h2><a href="#" @click="goToBlog(blog._id)" class="text-decoration-none text-dark">{{ blog.title }}</a></h2>
                <p class="text-muted mb-1">
                  By
                  <RouterLink 
                    v-if="blog.author?.username" 
                    :to="`/posts/user/${blog.author.username}`" 
                    class="text-decoration-none fw-bold"
                  >
                  {{ blog.author?.username || 'Unknown' }}
                  </RouterLink>
                  &bull; {{ blog.formattedDate }}
                </p>
                <p class="my-3">{{ stripAndTruncate(blog.content, 150) }}</p>

                <!-- Buttons -->
                <div class="mt-2">
                  <a href="#" @click.prevent="scrollToComments(blog._id)" class="text-decoration-none text-dark">
                    <i class="bi bi-chat"></i> {{ commentLabel(blog) }}
                  </a>
                  <span v-if="auth.user && blog.author && blog.author._id === auth.user._id" class="ms-2">
                    &bull;
                  <a href="#"
                    
                    class="text-primary text-decoration-none ms-2"
                    @click="editBlog(blog._id)"
                  ><i class="bi bi-pencil"></i> Edit Post</a></span>
                  <span v-if="auth.isAdmin || (auth.user && blog.author && blog.author._id === auth.user._id)" class="ms-2">
                    &bull;
                  <a href="#"
                    
                    class="text-danger text-decoration-none ms-2"
                    @click="DeleteBlog(blog._id)"
                  ><i class="bi bi-trash"></i> Delete Post</a></span>
                  <!-- <button class="btn btn-sm btn-secondary" @click="goToBlog(blog._id)">
                    Read Post
                  </button> -->
                </div>
              </div>

              <!-- Image column: small image -->
              <div class="col-12 mt-4 mt-lg-0 col-lg-4 d-flex align-items-center justify-content-center">
                <div style="width: 100%; aspect-ratio: 7 / 5; overflow: hidden; cursor: pointer;" @click="goToBlog(blog._id)">
                  <img
                    :src="blog.featuredImage || 'https://placehold.co/400x400?text=No+Image'"
                    class="img-fluid w-100 h-100 rounded"
                    style="object-fit: cover;"
                  />
                </div>
              </div>

              <div class="col-12">
                <hr class="mt-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar: 20%, empty for now -->
      <div class="col-md-3">
        <div class="px-3">
          <h3 class="mb-3">Discussion</h3>

          <div v-if="latestComments.length === 0" class="text-muted">
            No comments yet.
          </div>

          <div v-else>
            <div 
              v-for="comment in latestComments" 
              :key="comment._id" 
              class="mb-3 border-bottom pb-2"
            >
              <p class="mb-1">
                <RouterLink 
                  v-if="comment.user?.username" 
                  :to="`/posts/user/${comment.user.username}`" 
                  class="text-decoration-none fw-bold"
                >
                  {{ comment.user.username }}
                </RouterLink>
                <span v-else><strong>Unknown</strong></span>
                <small class="text-muted ms-2">{{ formatDate(comment.createdAt) }}</small>
              </p>
              <p class="mb-0">
                Commented on 
                <RouterLink :to="`/posts/view/${comment.post._id}`" class="text-decoration-none">
                  {{ comment.post.title }}
                </RouterLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../services/api.js'; 

const auth = useUserStore()
const router = useRouter()

const route = useRoute()
const username = computed(() => route.params.username || null)

// Message system
const showForm = ref(false)
const message = ref('')
const messageType = ref('success')
const adding = ref(false)

const form = reactive({
  title: '',
  content: '',
  featuredImage: ''
})

// Blogs
const blogs = ref([])
const loading = ref(true)
const itemsPerPage = 10
const currentPage = ref(1)

// Check if we are on a user page
const isUserPage = computed(() => !!route.params.username)

// Compute page title
const pageTitle = computed(() => {
  if (!isUserPage.value) return 'All Posts'

  // If logged-in user is viewing their own profile
  if (auth.user && auth.user.username === route.params.username) {
    return 'My Posts'
  }

  // Viewing someone else's profile
  const username = route.params.username
  const suffix = username.toLowerCase().endsWith('s') ? "'" : "'s"
  return `${username}${suffix} Posts`
})

// Helper to format dates
const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) // e.g., "02 Mar 2026"
}

// Function to strip HTML and truncate without cutting words
const stripAndTruncate = (html, maxLength) => {
  if (!html) return ''

  // Remove HTML tags and collapse multiple spaces
  let text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  // If text is short enough, return it
  if (text.length <= maxLength) return text

  // Truncate without cutting words
  let truncated = text.slice(0, maxLength)

  // Find last space in truncated text
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > 0) {
    truncated = truncated.slice(0, lastSpace)
  }

  return truncated + '...'
}

// Scroll to comments
const scrollToComments = async (id) => {
  const currentPath = router.currentRoute.value.path

  if (currentPath !== `/posts/view/${id}`) {
    // Use object form for hash
    router.push({ path: `/posts/view/${id}`, hash: '#comments' })
  } else {
    await nextTick()
    const el = document.querySelector('#comments')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }
}

// Computed for pagination
const activeBlogs = computed(() => blogs.value.filter(p => p.isActive))
const totalPages = computed(() => Math.ceil(blogs.value.length / itemsPerPage))
const paginatedBlogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return blogs.value.slice(start, start + itemsPerPage)
})

watch(() => route.params.username, () => {
  fetchBlogs()
})

// Fetch all blogs
const fetchBlogs = async () => {
  loading.value = true
  try {
    let url = "/posts/all"

    if (username.value) {
      // Fetch blogs of a specific user
      url = `/posts/user/${username.value}`
    }

    const res = await api.get(url) // API should populate author
    let fetched = res.data.blogs || []

    // Sort newest first
    fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Add formattedDate
    blogs.value = fetched.map(blog => ({
      ...blog,
      formattedDate: formatDate(blog.createdAt)
    }))

    message.value = ""
    messageType.value = "success"

  } catch (err) {
    console.error("Failed to fetch blogs:", err)
    blogs.value = []
    message.value = err.response?.data?.message || "Failed to fetch posts."
    messageType.value = "error"
  } finally {
    loading.value = false
  }
}

// Reset form
const cancelForm = () => {
  Object.assign(form, { title: '', content: '', featuredImage: '' })
  showForm.value = false
}

// Actions
const goToBlog = (id) => router.push(`/posts/view/${id}`)
const editBlog = (id) => router.push(`/posts/edit/${id}`)

const DeleteBlog = async (blogId) => {
  try {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    await api.delete(`/posts/delete/${blogId}`);
    console.log(blogId);
    blogs.value = blogs.value.filter(w => w._id !== blogId);
    message.value = "Blog post deleted successfully.";
    messageType.value = "success";
    setTimeout(() => { message.value = '' }, 3000);
  } catch (err) {
    console.error(err);
    message.value = err.response?.data?.message || "Failed to delete blog post.";
    messageType.value = "error";
    setTimeout(() => { message.value = '' }, 3000);
  }
};

const commentLabel = (blog) => {
  const count = blog.comments?.length || 0
  if (count === 0) return "Comment"
  return `${count} Comment${count > 1 ? 's' : ''}`
}

// On mounted, fetch user details and blogs
onMounted(async () => {
  if (auth.token && !auth.user) {
    try {
      const res = await api.get("/users/details", {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      auth.setUser(res.data.user)
    } catch (err) {
      console.error("Failed to fetch user:", err)
    }
  }

  fetchBlogs()
})

watch(() => route.params.username, (username) => {
  document.title = username ? `${username}'s Posts | Blog App` : "All Posts | Blog App";
}, { immediate: true });

// Latest comments
const latestComments = ref([])

// Fetch latest 5 comments for sidebar
const fetchLatestComments = async () => {
  try {
    const res = await api.get('/posts/latestComments?limit=5') // your API endpoint
    // API should return array of comments with: _id, createdAt, content, user {_id, username}, post {_id, title}
    latestComments.value = res.data.comments || []
  } catch (err) {
    console.error("Failed to fetch latest comments:", err)
    latestComments.value = []
  }
}

// Fetch on mounted
onMounted(() => {
  fetchLatestComments()
})
</script>