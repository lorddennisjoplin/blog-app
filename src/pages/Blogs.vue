<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">All Blogs</h1>

    <div class="row">
      <!-- Main content: 80% -->
      <div class="col-md-9">
        <div v-if="loading" class="alert alert-info py-2">Loading blogs...</div>

        <div v-else>
          <div v-for="blog in blogs" :key="blog._id" class="row mb-3 align-items-center">
            <!-- Text column: full width on small screens -->
            <div class="col-12 col-lg-8 d-flex flex-column justify-content-between">
              <h3>{{ blog.title }}</h3>
              <p class="text-muted mb-1">
                By {{ blog.author?.username || 'Unknown' }} &bull; {{ blog.formattedDate }}
              </p>
              <p class="mb-2">{{ stripAndTruncate(blog.content, 150) }}</p>

              <!-- Buttons -->
              <div>
                <i class="bi bi-chat"></i> Comment
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
                  class="img-fluid w-100 h-100"
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

      <!-- Sidebar: 20%, empty for now -->
      <div class="col-md-3">
        <div class="border p-3" style="min-height: 500px;">
          <!-- Sidebar content will go here -->
          <p class="text-muted">Sidebar reserved space</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../services/api.js'; 

const auth = useUserStore()
const router = useRouter()

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

// Function to strip HTML and truncate
const stripAndTruncate = (html, maxLength) => {
  if (!html) return ''
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ')
  // Truncate and add ellipses if needed
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

// Computed for pagination
const activeBlogs = computed(() => blogs.value.filter(p => p.isActive))
const totalPages = computed(() => Math.ceil(blogs.value.length / itemsPerPage))
const paginatedBlogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return blogs.value.slice(start, start + itemsPerPage)
})

// Fetch all blogs
const fetchBlogs = async () => {
  loading.value = true
  try {
    const res = await api.get("/blogs/all") // API should populate author
    let fetched = res.data.blogs || []

    // Sort by creation date (newest first)
    fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Add formattedDate to each blog
    blogs.value = fetched.map(blog => ({
      ...blog,
      formattedDate: formatDate(blog.createdAt)
    }))

    message.value = ""
    messageType.value = "success"

  } catch (err) {
    console.error("Failed to fetch blogs:", err)
    blogs.value = []
    message.value = err.response?.data?.message || "Failed to fetch blogs."
    messageType.value = "error"
  } finally {
    loading.value = false
  }
}

// Add blog
const handleAddBlog = async () => {
  try {
    adding.value = true
    const res = await api.post('/blogs/addBlog', form)

    // Add formattedDate to the new blog
    const newBlog = {
      ...res.data,
      formattedDate: formatDate(res.data.createdAt)
    }

    blogs.value.unshift(newBlog)
    currentPage.value = 1

    cancelForm()

    message.value = 'Blog added successfully.'
    messageType.value = 'success'
    setTimeout(() => message.value = '', 1500)

  } catch (err) {
    message.value = err.response?.data?.message || err.message
    messageType.value = 'error'
  } finally {
    adding.value = false
  }
}

// Reset form
const cancelForm = () => {
  Object.assign(form, { title: '', content: '', featuredImage: '' })
  showForm.value = false
}

// Actions
const goToBlog = (id) => router.push(`/blogs/post/${id}`)
const editBlog = (id) => router.push(`/blogs/edit/${id}`)

const DeleteBlog = async (blogId) => {
  try {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    await api.delete(`/blogs/delete/${blogId}`);
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
</script>