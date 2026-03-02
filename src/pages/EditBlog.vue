<template>
  <div class="container my-5">

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading blog post...
    </div>

    <!-- After Loading -->
    <div v-else>

      <!-- ADMIN: EDIT MOVIE FORM -->
      <div v-if="auth.isAdmin" class="card p-4 mt-3">
        <h1 class="mb-3">Edit Blog</h1>

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
          <input v-model="form.title" type="text" class="form-control mb-2" placeholder="Title" required />
          <input v-model="form.director" type="text" class="form-control mb-2" placeholder="Director" required />
          <input v-model="form.year" type="text" class="form-control mb-2" placeholder="Year" pattern="\d{4}" title="Year must be 4 digits" required />
          <textarea v-model="form.description" class="form-control mb-2" placeholder="Description" required></textarea>
          <input v-model="form.genre" type="text" class="form-control mb-3" placeholder="Genre" required />
          <input v-model="form.image" type="url" class="form-control mb-2" placeholder="Poster URL" required />

          <button class="btn btn-primary btn-sm me-2" :disabled="editing">
            <span v-if="editing">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Saving...
            </span>
            <span v-else>
              Save Changes
            </span>
          </button>
          
          <button class="btn btn-secondary btn-sm me-2"  @click="cancelOrder">Cancel</button>
        </form>
      </div>

      <!-- NON-ADMIN: SEE MOVIE DETAILS -->
      <div v-else-if="blog" class="card shadow-sm p-4 mt-3 col-md-6 mx-auto">
        <h1 class="card-title mb-2">{{ blog.title }}</h1>
        <p class="fw-bold text-muted mb-0">By {{ blog.author?.username || 'Unknown' }} &bull; {{ formattedDate }}</p>
        <hr>
        <p class="card-img mb-4"><img v-if="blog.featuredImage" :src="blog.featuredImage" style="width: 100%;" class="img-fluid rounded" /></p>
        <div class="card-text mb-3" v-html="blog.content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../services/api.js';

const route = useRoute()
const router = useRouter()
const auth = useUserStore()

const blog = ref(null)
const loading = ref(true)
const editing = ref(false)
const errorMessage = ref("")

const message = ref('')       // For success/error messages
const messageType = ref('')

// Format blog post date
const formattedDate = computed(() => {
  if (!blog.value?.createdAt) return ''
  const date = new Date(blog.value.createdAt)
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
})

const form = reactive({
  title: '',
  content: '',
  featuredImage: ''
})

const moreBlogs = ref([])

// Load blog
onMounted(async () => {
  try {
    const res = await api.get(`/blogs/post/${route.params.id}`);

    Object.assign(form, res.data.blog);
    blog.value = res.data.blog;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});


const goToBlogs = (id) => router.push(`/blogs`)

const handleEditBlog = async () => {
  try {
    editing.value = true
    await api.patch(`/blogs/updateBlog/${route.params.id}`, form)

    // Show confirmation message
    message.value = "Blog updated successfully."
    messageType.value = "success"

    // Wait 3 seconds then redirect
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