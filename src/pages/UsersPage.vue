<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">All Users</h1>

    <div v-if="auth.isAdmin" class="mb-3">
      <button class="btn btn-sm btn-primary me-2" id="addUser" @click="showForm = !showForm">
        Add User
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
      <h2 class="mb-3">Add User</h2>

      <!-- Success / Error Alert -->
      <div
        v-if="message && users.value?.length === 0"
        :class="[
          'alert py-2',
          messageType === 'success' ? 'alert-success' : 'alert-danger'
        ]"
      >
        {{ message }}
      </div>

      <form @submit.prevent="handleAddUser">
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
      <div v-if="loading" class="alert alert-info py-2">Loading users...</div>

      <div v-else-if="paginatedUsers.length && auth.isAdmin">
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
              <tr v-for="user in paginatedUsers" :key="user._id">
                <td class="text-center">
                  <img :src="user.image || 'https://placehold.co/400x400?text=No+Image'" width="150" class="img-fluid" />
                </td>
                <td class="text-center">{{ user.title }}</td>
                <td class="text-center">{{ user.director }}</td>
                <td class="text-center">{{ user.year }}</td>
                <td>{{ user.description }}</td>
                <td class="text-center">{{ user.genre }}</td>
                <td class="text-center" style="white-space: nowrap;">
                  <button class="btn btn-sm btn-primary me-2" @click="editUser(user._id)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-danger" @click="DeleteUser(user._id)">
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
          v-for="user in users"
          :key="user._id"
          class="col-12 col-md-4 mb-4"
        >
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <a href="#"><img :src="user.image || 'https://placehold.co/400x400?text=No+Image'" width="150" class="card-img mb-4 img-fluid" @click="goToUser(user._id)" /></a>
              <h3 class="card-title">{{ user.title }}</h3>
              <h6 class="card-subtitle mb-2 text-muted">{{ user.director }} ({{ user.year }})</h6>
              <p class="text-success mb-3">{{ user.genre }}</p>
              <button class="btn btn-primary" @click="goToUser(user._id)">View User Details</button>
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

// Users
const users = ref([])
const loading = ref(true)
const itemsPerPage = 10
const currentPage = ref(1)

const activeUsers = computed(() => users.value.filter(p => p.isActive))
const totalPages = computed(() => Math.ceil(users.value.length / itemsPerPage))
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return users.value.slice(start, start + itemsPerPage)
})

// Fetch users
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await api.get("/users/getUsers")

    const fetched = res.data.users || []

    fetched.sort((a, b) => b._id.localeCompare(a._id))

    users.value = fetched

    message.value = ""
  } catch (err) {
    console.error(err)
    users.value = []
    message.value = err.response?.data?.message || "Failed to fetch users."
    messageType.value = "error"
  } finally {
    loading.value = false
  }
}

// Add user
const handleAddUser = async () => {
  try {
    adding.value = true
    const res = await api.post('/users/addUser', form)

    users.value.unshift(res.data)
    currentPage.value = 1

    cancelForm()

    message.value = 'User added successfully.'
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
const editUser = (id) => router.push(`/users/user/${id}`)

const DeleteUser = async (userId) => {
  try {
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this user?")) return;

    // Call API
    await api.delete(`/users/deleteUser/${userId}`);

    // Remove user locally
    users.value = users.value.filter(w => w._id !== userId);

    // Show success message
    message.value = "User deleted successfully.";
    messageType.value = "success";

    // Clear message after 3 seconds
    setTimeout(() => { message.value = '' }, 3000);

  } catch (err) {
    console.error(err);
    message.value = err.response?.data?.message || "Failed to delete user.";
    messageType.value = "error";

    setTimeout(() => { message.value = '' }, 3000);
  }
};

const goToUser = (id) => router.push(`/users/user/${id}`)

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

  fetchUsers()
})
</script>