<template>
	<div v-if="auth.user" class="card p-3 my-3 text-start">
      <h2 class="mb-3">Add Blog</h2>

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
        <input v-model="form.title" type="text" class="form-control mb-2" placeholder="Title" required />
        <input v-model="form.director" type="text" class="form-control mb-2" placeholder="Director" required />
        <input v-model="form.year" type="text" class="form-control mb-2" placeholder="Year" pattern="\d{4}" title="Year must be 4 digits" required />
        <textarea v-model="form.description" class="form-control mb-2" placeholder="Description" required></textarea>
        <input v-model="form.genre" type="text" class="form-control mb-2" placeholder="Genre" required />
        <input v-model="form.image" type="url" class="form-control mb-2" placeholder="Poster URL" />

        <button type="submit" class="btn btn-sm btn-primary me-2" :disabled="adding">
          <span v-if="adding">
            <span class="spinner-border spinner-border-sm me-1"></span>
            Adding...
          </span>
          <span v-else>
            Save
          </span>
        </button>

        <button type="button" class="btn btn-sm btn-secondary me-2" @click="cancelForm" :disabled="adding">
          Cancel
        </button>
      </form>
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

// Fetch blogs
const fetchBlogs = async () => {
  loading.value = true
  try {
    const res = await api.get("/blogs/getBlogs")

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