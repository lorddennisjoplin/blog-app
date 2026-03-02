<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">All Blogs</h1>

    <div v-if="auth.isAdmin" class="mb-3">
      <button class="btn btn-sm btn-primary me-2" id="addBlog" @click="showForm = !showForm">
        Add Blog
      </button>
    </div>

    <div
      v-if="message"
      :class="[
        'alert py-2',
        messageType === 'success' ? 'alert-success' : 'alert-danger'
      ]"
    >
      {{ message }}
    </div>

    <div class="mt-4 text-start">
      <div v-if="loading" class="alert alert-info py-2">Loading blogs...</div>

      <div v-else-if="paginatedBlogs.length && auth.isAdmin">
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th class="text-center">Poster</th>
                <th class="text-center">Title</th>
                <th class="text-center">Director</th>
                <th class="text-center">Year</th>
                <th class="text-center">Description</th>
                <th class="text-center">Genre</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="blog in paginatedBlogs" :key="blog._id">
                <td class="text-center">
                  <img :src="blog.featuredImage || 'https://placehold.co/400x400?text=No+Image'" width="150" class="img-fluid" />
                </td>
                <td class="text-center">{{ blog.title }}</td>
                <td class="text-center">{{ blog.director }}</td>
                <td class="text-center">{{ blog.year }}</td>
                <td>{{ blog.description }}</td>
                <td class="text-center">{{ blog.genre }}</td>
                <td class="text-center" style="white-space: nowrap;">
                  <button class="btn btn-sm btn-primary me-2" @click="editBlog(blog._id)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-danger" @click="DeleteBlog(blog._id)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="mt-3">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">Previous</button>
            </li>

            <li
              v-for="page in totalPages"
              :key="page"
              class="page-item"
              :class="{ active: page === currentPage }"
            >
              <button class="page-link" @click="currentPage = page">{{ page }}</button>
            </li>

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">Next</button>
            </li>
          </ul>
        </nav>
      </div>

      <div v-else>
        <div class="row">
        <div
          v-for="blog in blogs"
          :key="blog._id"
          class="col-12 col-md-3 mb-3"
        >
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <a href="#"><img :src="blog.featuredImage || 'https://placehold.co/400x400?text=No+Image'" width="150" class="card-img mb-4 img-fluid" @click="goToBlog(blog._id)" /></a>
              <h3 class="card-title">{{ blog.title }}</h3>
              <h6 class="card-subtitle mb-3 text-muted">
                By {{ blog.author?.name || 'Unknown' }}
              </h6>
              <button class="btn btn-primary" @click="goToBlog(blog._id)">Read Post</button>
            </div>
          </div>
        </div>
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
  director: '',
  year: '',
  description: '',
  genre: '',
  image: ''
})

// Blogs
const blogs = ref([])
const loading = ref(true)
const itemsPerPage = 10
const currentPage = ref(1)

const activeBlogs = computed(() => blogs.value.filter(p => p.isActive))
const totalPages = computed(() => Math.ceil(blogs.value.length / itemsPerPage))
const paginatedBlogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return blogs.value.slice(start, start + itemsPerPage)
})

// Fetch blogs
const fetchBlogs = async () => {
  loading.value = true
  try {
    const res = await api.get("/blogs/all")

    const fetched = res.data.blogs || []

    fetched.sort((a, b) => b._id.localeCompare(a._id))

    blogs.value = fetched

    message.value = ""
  } catch (err) {
    console.error(err)
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

    blogs.value.unshift(res.data)
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

const cancelForm = () => {
  Object.assign(form, { name: '', duration: '' })
  showForm.value = false
}

// Admin actions
const editBlog = (id) => router.push(`/blogs/blog/${id}`)

const DeleteBlog = async (blogId) => {
  try {
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this blog?")) return;

    // Call API
    await api.delete(`/blogs/deleteBlog/${blogId}`);

    // Remove blog locally
    blogs.value = blogs.value.filter(w => w._id !== blogId);

    // Show success message
    message.value = "Blog deleted successfully.";
    messageType.value = "success";

    // Clear message after 3 seconds
    setTimeout(() => { message.value = '' }, 3000);

  } catch (err) {
    console.error(err);
    message.value = err.response?.data?.message || "Failed to delete blog.";
    messageType.value = "error";

    setTimeout(() => { message.value = '' }, 3000);
  }
};

const goToBlog = (id) => router.push(`/blogs/blog/${id}`)

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