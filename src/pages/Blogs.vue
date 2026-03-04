<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">{{ pageTitle }}</h1>

    <div class="row">
      <!-- Main content: 80% -->
      <div class="col-md-9 mb-5 mb-lg-0">
        <div v-if="loading" class="alert alert-info py-2">Loading posts...</div>

        <div v-else>
          <div v-if="message && messageType === 'warning'" class="alert alert-warning py-2">
            {{ message }}
          </div>
          <div v-else-if="blogs.length === 0">
            <template v-if="isUserPage && auth.user?.username === route.params.username">
              <div class="alert alert-warning py-2">
                You haven't made any posts.
              </div>
            </template>
            <template v-else>
              <div class="alert alert-warning py-2">
                No posts found.
              </div>
            </template>

            <p><img src="https://i.imgur.com/rU9swVr.jpeg" alt="No posts found" class="img-fluid" border="0" width="200"></p>

            <RouterLink to="/posts/add" v-if="isUserPage && auth.user?.username === route.params.username">
              <button class="btn btn-success">Create First Post</button>
            </RouterLink>

          </div>

          <div v-else>
            <div v-for="blog in paginatedBlogs" :key="blog._id" class="row align-items-center">
              <!-- Image column -->
              <div 
                class="col-12 col-lg-4 d-flex align-items-center justify-content-center order-1 order-lg-2 mb-3 mb-lg-0"
              >
                <div style="width: 100%; aspect-ratio: 7 / 5; overflow: hidden; cursor: pointer;" @click="goToBlog(blog._id)">
                  <img
                    :src="blog.featuredImage || 'https://placehold.co/400x400?text=No+Image'"
                    class="img-fluid w-100 h-100 rounded"
                    style="object-fit: cover;"
                  />
                </div>
              </div>

              <!-- Text column -->
              <div class="col-12 col-lg-8 d-flex flex-column justify-content-between order-2 order-lg-1">
                <h2>
                  <a href="#" @click="goToBlog(blog._id)" class="text-decoration-none text-dark">
                    {{ blog.title }}
                  </a>
                </h2>
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
                    <a href="#" class="text-primary text-decoration-none ms-2" @click="editBlog(blog._id)">
                      <i class="bi bi-pencil"></i> Edit Post
                    </a>
                  </span>

                  <span v-if="auth.isAdmin || (auth.user && blog.author && blog.author._id === auth.user._id)" class="ms-2">
                    &bull;
                    <a href="#" class="text-danger text-decoration-none ms-2" @click="DeleteBlog(blog._id)">
                      <i class="bi bi-trash"></i> Delete Post
                    </a>
                  </span>
                </div>
              </div>

              <div class="col-12">
                <hr class="my-4" />
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="my-5">
              <nav>
                <ul class="pagination justify-content-center">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">Previous</button>
                  </li>
                  <li
                    class="page-item"
                    v-for="page in totalPages"
                    :key="page"
                    :class="{ active: currentPage === page }"
                  >
                    <button class="page-link" @click="currentPage = page">{{ page }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">Next</button>
                  </li>
                </ul>
              </nav>
            </div>

          </div>
        </div>
      </div>

      <!-- Sidebar: 20% -->
      <div class="col-md-3">
        <div class="px-0 px-lg-3">
          <h3 class="mb-3">Join the Discussion</h3>

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
                Commented
                <em>&ldquo;{{ stripAndTruncate(comment.content, 150) }}&rdquo;</em>
                on
                <RouterLink 
                  :to="{ path: `/posts/view/${comment.post._id}`, hash: '#comments' }" 
                  class="text-decoration-none"
                >
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
import api from '../services/api.js'

const auth = useUserStore()
const router = useRouter()
const route = useRoute()
const username = computed(() => route.params.username || null)

// Form & message system
const showForm = ref(false)
const message = ref('')
const messageType = ref('success')
const adding = ref(false)
const form = reactive({ title: '', content: '', featuredImage: '' })

// Blogs
const blogs = ref([])
const loading = ref(true)
const itemsPerPage = 10
const currentPage = ref(1)

// Check user page
const isUserPage = computed(() => !!route.params.username)
const pageTitle = computed(() => {
  if (!isUserPage.value) return 'All Posts'
  if (auth.user && auth.user.username === route.params.username) return 'My Posts'
  const suffix = route.params.username.toLowerCase().endsWith('s') ? "'" : "'s"
  return `${route.params.username}${suffix} Posts`
})

// Format date
const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Strip HTML + truncate
const stripAndTruncate = (html, maxLength) => {
  if (!html) return ''
  let text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  let truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > 0) truncated = truncated.slice(0, lastSpace)
  return truncated + '...'
}

// Scroll to comments
const scrollToComments = async (id) => {
  const currentPath = router.currentRoute.value.path;

  if (currentPath !== `/posts/view/${id}`) {
    // Navigate to the post with hash
    router.push({ path: `/posts/view/${id}`, hash: '#comments' });
  } else {
    // Already on the page, wait until comments exist
    const waitForComments = () => new Promise((resolve) => {
      const interval = setInterval(() => {
        const el = document.querySelector('#comments');
        if (el) {
          clearInterval(interval);
          resolve(el);
        }
      }, 50);
      setTimeout(() => clearInterval(interval), 2000); // fallback
    });

    const el = await waitForComments();
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
};
// Pagination
const totalPages = computed(() => Math.ceil(blogs.value.length / itemsPerPage))
const paginatedBlogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return blogs.value.slice(start, start + itemsPerPage)
})

// Fetch blogs
const fetchBlogs = async () => {
  loading.value = true
  try {
    let url = username.value ? `/posts/user/${username.value}` : '/posts/all'
    const res = await api.get(url)
    let fetched = res.data.blogs || []
    fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    blogs.value = fetched.map(blog => ({ ...blog, formattedDate: formatDate(blog.createdAt) }))
    message.value = ''
  }
  catch (err) {
    console.error(err)

    blogs.value = []

    if (err.response?.status === 404) {
      message.value = err.response.data.message
      messageType.value = "warning"
    } else {
      message.value = "Failed to fetch posts."
      messageType.value = "error"
    }

  } finally {
    loading.value = false
  }
}

// Actions
const goToBlog = (id) => router.push(`/posts/view/${id}`)
const editBlog = (id) => router.push(`/posts/edit/${id}`)
const DeleteBlog = async (blogId) => {
  if (!confirm("Are you sure you want to delete this post?")) return
  try {
    await api.delete(`/posts/delete/${blogId}`)
    blogs.value = blogs.value.filter(b => b._id !== blogId)
    message.value = "Blog post deleted successfully."
    messageType.value = "success"
    setTimeout(() => { message.value = '' }, 3000)
  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || "Failed to delete blog post."
    messageType.value = "error"
    setTimeout(() => { message.value = '' }, 3000)
  }
}

const commentLabel = (blog) => {
  const count = blog.comments?.length || 0
  return count === 0 ? "Comment" : `${count} Comment${count > 1 ? 's' : ''}`
}

// Latest comments sidebar
const latestComments = ref([])
const fetchLatestComments = async () => {
  try {
    const res = await api.get('/posts/latestComments?limit=5')
    latestComments.value = res.data.comments || []
  } catch (err) {
    console.error("Failed to fetch latest comments:", err)
    latestComments.value = []
  }
}

// Mounted
onMounted(async () => {
  if (auth.token && !auth.user) {
    try {
      const res = await api.get("/users/details", { headers: { Authorization: `Bearer ${auth.token}` } })
      auth.setUser(res.data.user)
    } catch (err) { console.error(err) }
  }

  fetchBlogs()
  fetchLatestComments()
})

watch(() => route.params.username, () => fetchBlogs())
watch(() => route.params.username, (username) => {
  document.title = username ? `${username}'s Posts | Blog App` : "All Posts | Blog App"
}, { immediate: true })
</script>