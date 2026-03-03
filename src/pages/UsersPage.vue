<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">All Users</h1>

    <div v-if="auth.isAdmin" class="mb-3">
      <button class="btn btn-primary me-2" @click="showForm = !showForm">
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

    <!-- ADD USER FORM -->
    <div v-if="showForm && auth.isAdmin" class="card p-3 my-3 text-start">
      <h2 class="mb-3">Add User</h2>

      <form @submit.prevent="handleAddUser">
        <input v-model="form.username" type="text" class="form-control mb-2" placeholder="Username" required />
        <input v-model="form.email" type="text" class="form-control mb-2" placeholder="Email Address" required />
        <input v-model="form.password" type="password" class="form-control mb-2" minlength="8" placeholder="Password" required />
        <input v-model="form.confirmPassword" type="password" class="form-control mb-3" minlength="8" placeholder="Confirm Password" required />

        <div class="form-check mb-3">
          <input v-model="form.isAdmin" type="checkbox" class="form-check-input" id="isAdminCheckbox" />
          <label class="form-check-label" for="isAdminCheckbox">
            Make Admin?
          </label>
        </div>

        <button type="submit" class="btn btn-sm btn-primary me-2" :disabled="adding">
          <span v-if="adding">
            <span class="spinner-border spinner-border-sm me-1"></span>
            Adding...
          </span>
          <span v-else>Add</span>
        </button>

        <button type="button" class="btn btn-sm btn-secondary" @click="cancelForm">
          Cancel
        </button>
      </form>
    </div>

    <!-- USERS TABLE -->
    <div class="mt-4">
      <div v-if="loading" class="alert alert-info py-2">Loading users...</div>

      <div v-else-if="paginatedUsers.length && auth.isAdmin">
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th class="text-center">Username</th>
                <th class="text-center">Email</th>
                <th class="text-center">Posts</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user._id">
                <td class="text-center">
                    {{ user.username }}
                </td>

                <td class="text-center">{{ user.email }}</td>

                <td class="text-center">
                  <router-link
                    :to="`/posts/user/${user.username}`"
                    class="fw-bold text-decoration-none"
                  >
                    {{ user.postCount || 0 }}
                  </router-link>
                </td>

                <td class="text-center">
				  <button
				    class="btn btn-sm me-2"
				    :class="user.isAdmin ? 'btn-warning' : 'btn-success'"
				    @click="toggleAdmin(user)"
				  >
				    {{ user.isAdmin ? 'Remove Admin' : 'Make Admin' }}
				  </button>

				  <button class="btn btn-sm btn-primary me-2" @click="editUser(user.username)">
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

        <!-- PAGINATION -->
        <nav v-if="totalPages > 1" class="mt-3">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="currentPage--">Previous</button>
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
              <button class="page-link" @click="currentPage++">Next</button>
            </li>
          </ul>
        </nav>
      </div>

      <div v-else class="alert alert-warning">No users found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../services/api.js'

const auth = useUserStore()
const router = useRouter()

const showForm = ref(false)
const message = ref('')
const messageType = ref('success')
const adding = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  isAdmin: false
})

const users = ref([])
const loading = ref(true)
const itemsPerPage = 10
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.ceil(users.value.length / itemsPerPage)
)

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return users.value.slice(start, start + itemsPerPage)
})

// Fetch number of posts for the user
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await api.get('/users/all')
    const fetchedUsers = res.data.users || []

    // Fetch post count for each user
    const usersWithPostCount = await Promise.all(
      fetchedUsers.map(async (user) => {
        try {
          const postRes = await api.get(`/posts/user/${user.username}`)
          return {
            ...user,
            postCount: postRes.data.blogs?.length || 0
          }
        } catch (err) {
          return {
            ...user,
            postCount: 0
          }
        }
      })
    )

    users.value = usersWithPostCount

  } catch (err) {
    message.value = err.response?.data?.message || 'Failed to fetch users.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

const handleAddUser = async () => {
  try {
    adding.value = true
    const res = await api.post('/users/register', form)
    users.value.unshift(res.data)
    cancelForm()
    message.value = 'User added successfully.'
    messageType.value = 'success'
  } catch (err) {
    message.value = err.response?.data?.message || err.message
    messageType.value = 'error'
  } finally {
    adding.value = false
  }
}

const cancelForm = () => {
  Object.assign(form, {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAdmin: false
  })
  showForm.value = false
}

const toggleAdmin = async (user) => {
  try {
    const res = await api.patch(`/users/edit/${user._id}`)

    // Update UI instantly
    user.isAdmin = res.data.isAdmin

    message.value = res.data.message || 'User role updated.'
    messageType.value = 'success'

    setTimeout(() => {
      message.value = ''
    }, 2000)

  } catch (err) {
    message.value = err.response?.data?.message || 'Failed to update role.'
    messageType.value = 'error'

    setTimeout(() => {
      message.value = ''
    }, 2000)
  }
}

const editUser = (username) => {
  router.push(`/user/${username}`)
}

const DeleteUser = async (userId) => {
  if (!confirm('Are you sure you want to delete this user?')) return

  try {
    await api.delete(`/users/deleteUser/${userId}`)
    users.value = users.value.filter(u => u._id !== userId)
    message.value = 'User deleted successfully.'
    messageType.value = 'success'
  } catch (err) {
    message.value = err.response?.data?.message || 'Failed to delete user.'
    messageType.value = 'error'
  }
}

onMounted(fetchUsers)
</script>