<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">
      {{ isEditing ? "Edit User" : "All Users" }}
    </h1>

    <!-- ADMIN ACTION BUTTON -->
    <div v-if="auth.isAdmin && !isEditing" class="mb-3">
      <button class="btn btn-primary me-2" @click="showForm = !showForm">
        Add User
      </button>
    </div>

    <!-- ALERT MESSAGE -->
    <div
      v-if="message"
      :class="[
        'alert py-2',
        messageType === 'success' ? 'alert-success' : 'alert-danger'
      ]"
    >
      {{ message }}
    </div>

    <!-- ===================== -->
    <!-- EDIT USER FORM -->
    <!-- ===================== -->
    <div v-if="isEditing" class="card p-3 my-3">
      <h2 class="mb-3">Edit User</h2>

      <form @submit.prevent="handleEditUser">
        <input
          v-model="editForm.username"
          type="text"
          class="form-control mb-2"
          placeholder="Username"
          required
        />

        <input
          v-model="editForm.email"
          type="text"
          class="form-control mb-2"
          placeholder="Email Address"
          required
        />

        <div class="form-check mb-3" v-if="auth.isAdmin">
          <input
            v-model="editForm.isAdmin"
            type="checkbox"
            class="form-check-input"
            id="editIsAdminCheckbox"
          />
          <label class="form-check-label" for="editIsAdminCheckbox">
            Admin
          </label>
        </div>

        <button type="submit" class="btn btn-sm btn-primary me-2">
          Update
        </button>

        <button
          type="button"
          class="btn btn-sm btn-secondary"
          @click="cancelEdit"
        >
          Cancel
        </button>
      </form>
    </div>

    <!-- ===================== -->
    <!-- ADD USER FORM -->
    <!-- ===================== -->
    <div
      v-if="showForm && auth.isAdmin && !isEditing"
      class="card p-3 my-3"
    >
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

    <!-- ===================== -->
    <!-- USERS TABLE -->
    <!-- ===================== -->
    <div v-if="!isEditing" class="mt-4">
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
                <td class="text-center">{{ user.username }}</td>
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
                    v-if="auth.user._id !== user._id"
                    class="btn btn-sm btn-primary me-2"
                    @click="editUser(user._id)"
                  >
                    Edit
                  </button>

                  <router-link v-if="auth.user._id === user._id"
                    :to="'/profile'"
                    class="fw-bold text-decoration-none"
                  >
	                  <button
	                    class="btn btn-sm btn-primary me-2"
	                  >
	                    Edit Profile
	                  </button>
	              </router-link>

                  <button
                    v-if="auth.user._id !== user._id"
                    class="btn btn-sm btn-danger"
                    @click="DeleteUser(user._id)"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="alert alert-warning">No users found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../services/api.js'

const auth = useUserStore()
const router = useRouter()
const route = useRoute()

const showForm = ref(false)
const message = ref('')
const messageType = ref('success')
const adding = ref(false)
const isEditing = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  isAdmin: false
})

const editForm = reactive({
  _id: '',
  username: '',
  email: '',
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

/* =========================
   FETCH USERS
========================= */
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await api.get('/users/all')
    const fetchedUsers = res.data.users || []

    // Preserve your post count fetching
    const usersWithPostCount = await Promise.all(
      fetchedUsers.map(async (user) => {
        try {
          const postRes = await api.get(`/posts/user/${user.username}`)
          return { ...user, postCount: postRes.data.blogs?.length || 0 }
        } catch {
          return { ...user, postCount: 0 }
        }
      })
    )

    users.value = usersWithPostCount
  } catch (err) {
    message.value = 'Failed to fetch users.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

/* =========================
   LOAD USER FOR EDIT
========================= */
const loadUserForEdit = async (id) => {
  try {
    const res = await api.get(`/users/profile/${id}`)
    const user = res.data.data

    editForm._id = user._id
    editForm.username = user.username
    editForm.email = user.email
    editForm.isAdmin = user.isAdmin

    isEditing.value = true
    showForm.value = false
  } catch (err) {
    message.value = err.response?.data?.message || 'Failed to load user.'
    messageType.value = 'error'
  }
}

/* =========================
   UPDATE USER
========================= */
const handleEditUser = async () => {
  try {
    const res = await api.patch(`/users/edit/${editForm._id}`, editForm)

    message.value = 'User updated successfully. Redirecting...'
    messageType.value = 'success'

    setTimeout(() => {
	    message.value = ''
	  }, 2000)

    await fetchUsers()
    cancelEdit()

  } catch (err) {
    message.value = err.response?.data?.message || 'Update failed.'
    messageType.value = 'error'

    setTimeout(() => {
	    message.value = ''
	  }, 2000)
  }
}

const cancelEdit = () => {
  // Keep the edit form visible for 2 seconds
	message.value = ''
	isEditing.value = false
	router.push('/users')
}
/* =========================
   ADD USER
========================= */
const handleAddUser = async () => {
  try {
    adding.value = true
    await api.post('/users/register', form)
    await fetchUsers()
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

const editUser = (id) => {
  router.push(`/users/edit/${id}`)
}

const DeleteUser = async (userId) => {
  if (!confirm('Are you sure?')) return
  await api.delete(`/users/deleteUser/${userId}`)
  await fetchUsers()
}

/* =========================
   WATCH ROUTE
========================= */
watch(
  () => route.params.userId,
  (id) => {
    if (id) loadUserForEdit(id)
    else isEditing.value = false
  },
  { immediate: true }
)

onMounted(fetchUsers)
</script>