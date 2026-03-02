<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">All Movies</h1>

    <div v-if="auth.isAdmin" class="mb-3">
      <button class="btn btn-sm btn-primary me-2" id="addMovie" @click="showForm = !showForm">
        Add Movie
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

    <div v-if="showForm && auth.isAdmin" class="card p-3 my-3 text-start">
      <h2 class="mb-3">Add Movie</h2>

      <!-- Success / Error Alert -->
      <div
        v-if="message && movies.value?.length === 0"
        :class="[
          'alert py-2',
          messageType === 'success' ? 'alert-success' : 'alert-danger'
        ]"
      >
        {{ message }}
      </div>

      <form @submit.prevent="handleAddMovie">
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

    <div class="mt-4 text-start">
      <div v-if="loading" class="alert alert-info py-2">Loading movies...</div>

      <div v-else-if="paginatedMovies.length && auth.isAdmin">
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
              <tr v-for="movie in paginatedMovies" :key="movie._id">
                <td class="text-center">
                  <img :src="movie.image || 'https://placehold.co/400x400?text=No+Image'" width="150" class="img-fluid" />
                </td>
                <td class="text-center">{{ movie.title }}</td>
                <td class="text-center">{{ movie.director }}</td>
                <td class="text-center">{{ movie.year }}</td>
                <td>{{ movie.description }}</td>
                <td class="text-center">{{ movie.genre }}</td>
                <td class="text-center" style="white-space: nowrap;">
                  <button class="btn btn-sm btn-primary me-2" @click="editMovie(movie._id)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-danger" @click="DeleteMovie(movie._id)">
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
          v-for="movie in movies"
          :key="movie._id"
          class="col-12 col-md-4 mb-4"
        >
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <a href="#"><img :src="movie.image || 'https://placehold.co/400x400?text=No+Image'" width="150" class="card-img mb-4 img-fluid" @click="goToMovie(movie._id)" /></a>
              <h3 class="card-title">{{ movie.title }}</h3>
              <h6 class="card-subtitle mb-2 text-muted">{{ movie.director }} ({{ movie.year }})</h6>
              <p class="text-success mb-3">{{ movie.genre }}</p>
              <button class="btn btn-primary" @click="goToMovie(movie._id)">View Movie Details</button>
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

// Movies
const movies = ref([])
const loading = ref(true)
const itemsPerPage = 10
const currentPage = ref(1)

const activeMovies = computed(() => movies.value.filter(p => p.isActive))
const totalPages = computed(() => Math.ceil(movies.value.length / itemsPerPage))
const paginatedMovies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return movies.value.slice(start, start + itemsPerPage)
})

// Fetch movies
const fetchMovies = async () => {
  loading.value = true
  try {
    const res = await api.get("/movies/getMovies")

    const fetched = res.data.movies || []

    fetched.sort((a, b) => b._id.localeCompare(a._id))

    movies.value = fetched

    message.value = ""
  } catch (err) {
    console.error(err)
    movies.value = []
    message.value = err.response?.data?.message || "Failed to fetch movies."
    messageType.value = "error"
  } finally {
    loading.value = false
  }
}

// Add movie
const handleAddMovie = async () => {
  try {
    adding.value = true
    const res = await api.post('/movies/addMovie', form)

    movies.value.unshift(res.data)
    currentPage.value = 1

    cancelForm()

    message.value = 'Movie added successfully.'
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
const editMovie = (id) => router.push(`/movies/movie/${id}`)

const DeleteMovie = async (movieId) => {
  try {
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this movie?")) return;

    // Call API
    await api.delete(`/movies/deleteMovie/${movieId}`);

    // Remove movie locally
    movies.value = movies.value.filter(w => w._id !== movieId);

    // Show success message
    message.value = "Movie deleted successfully.";
    messageType.value = "success";

    // Clear message after 3 seconds
    setTimeout(() => { message.value = '' }, 3000);

  } catch (err) {
    console.error(err);
    message.value = err.response?.data?.message || "Failed to delete movie.";
    messageType.value = "error";

    setTimeout(() => { message.value = '' }, 3000);
  }
};

const goToMovie = (id) => router.push(`/movies/movie/${id}`)

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

  fetchMovies()
})
</script>