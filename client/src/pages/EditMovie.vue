<template>
  <div class="container my-5">

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading movie...
    </div>

    <!-- After Loading -->
    <div v-else>

      <!-- ADMIN: EDIT MOVIE FORM -->
      <div v-if="auth.isAdmin" class="card p-4 mt-3">
        <h1 class="mb-3">Edit Movie</h1>

        <div
          v-if="message"
          :class="[
            'alert py-2',
            messageType === 'success' ? 'alert-success' : 'alert-danger'
          ]"
        >
          {{ message }}
        </div>

        <form @submit.prevent="handleEditMovie">
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
      <div v-else-if="movie" class="card shadow-sm p-4 mt-3 col-md-6 mx-auto">
        <h1 class="card-title mb-0">{{ movie.title }}</h1>
        <hr>
        <p class="card-img mb-4"><img v-if="movie.image" :src="movie.image" style="width: 100%;" class="img-fluid rounded" /></p>
        <p class="card-text mb-3">
          {{ movie.description }}
        </p>
        <p class="fw-bold text-muted lead mb-0">{{ movie.director }} ({{ movie.year }})</p>
        <p class="mb-3"><strong>Genre:</strong> {{ movie.genre }}</p>

        <button class="btn btn-primary" @click="goToMovies()">See All Movies</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../services/api.js';

const route = useRoute()
const router = useRouter()
const auth = useUserStore()

const movie = ref(null)
const loading = ref(true)
const editing = ref(false)
const errorMessage = ref("")

const message = ref('')       // For success/error messages
const messageType = ref('')

const form = reactive({
  title: '',
  director: '',
  year: '',
  description: '',
  genre: '',
  image: ''
})

const moreMovies = ref([])

// Load movie
onMounted(async () => {
  try {
    const res = await api.get(`/movies/getMovie/${route.params.id}`);

    Object.assign(form, res.data.movie);
    movie.value = res.data.movie;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});


const goToMovies = (id) => router.push(`/movies`)

const handleEditMovie = async () => {
  try {
    editing.value = true
    await api.patch(`/movies/updateMovie/${route.params.id}`, form)

    // Show confirmation message
    message.value = "Movie updated successfully."
    messageType.value = "success"

    // Wait 3 seconds then redirect
    setTimeout(() => {
      router.push("/movies")
    }, 1500)

  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || "Failed to update movie."
    messageType.value = "error"
  } finally {
    editing.value = false
  }
}
</script>