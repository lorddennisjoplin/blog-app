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
          <textarea v-model="form.content" class="form-control mb-2" placeholder="Description" required></textarea>
          <input v-model="form.featuredImage" type="url" class="form-control mb-2" placeholder="Featured Image URL" required />

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

        <div v-if="auth.isAdmin">
          <button class="btn btn-sm btn-danger" @click="DeleteBlog(blog._id)">
            Delete
          </button>
        </div>
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

const blogId = route.params.id;

// Load blog
onMounted(async () => {
  try {
    const res = await api.get(`/blogs/post/${blogId}`);

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
    await api.patch(`/blogs/updateBlog/${blogId}`, form)

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

const DeleteBlog = async (blogId) => {
  try {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;

    await api.delete(`/blogs/delete/${blogId}`);

    message.value = "Blog post deleted successfully.";
    messageType.value = "success";

    setTimeout(() => {
      message.value = '';
      router.push("/blogs"); // redirect to blog list
    }, 3000);

  } catch (err) {
    console.error(err);
    message.value = err.response?.data?.message || "Failed to delete blog post.";
    messageType.value = "error";

    setTimeout(() => { message.value = '' }, 3000);
  }
};
</script>