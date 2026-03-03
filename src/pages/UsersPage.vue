<template>
  <div class="container my-5 text-start">
    <h1 class="mb-4">
      {{ isEditing ? "Edit User" : "All Users" }}
    </h1>

    <!-- ADMIN ACTION BUTTON -->
    <div v-if="auth.isAdmin && !isEditing" class="mb-4">
      <button class="btn btn-primary me-2" @click="showForm = !showForm">
        Add User
      </button>
    </div>

    <div v-if="loading" class="alert alert-info py-2">Loading users...</div>

    <!-- ADD USER FORM -->
    <div
      v-else-if="showForm && auth.isAdmin && !isEditing"
      class="card p-3 my-3">
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
    <div v-else-if="!isEditing" class="mt-3">
      

      <div v-if="paginatedUsers.length && auth.isAdmin">

      	<div
	      v-if="message"
	      :class="[
	        'alert py-2',
	        messageType === 'success' ? 'alert-success' : 'alert-danger'
	      ]"
	    >
	      {{ message }}
	    </div>

        <div class="table-responsive">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th class="text-center">Username</th>
                <th class="text-center">Email</th>
                <th class="text-center">Posts</th>
                <th class="text-center">Role</th>
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
                <td class="text-center">{{ user.isAdmin ? 'Admin' : 'User' }}</td>
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
					  @click="DeleteUser(user)">
					  Delete
					</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="alert alert-warning py-2">No users found.</div>
    </div>

    <!-- EDIT USER FORM -->
    <div v-else-if="isEditing" class="card p-3 my-3">
	  <div
	    v-if="message"
	    :class="[
	      'alert py-2',
	      messageType === 'success' ? 'alert-success' : 'alert-danger'
	    ]"
	  >
	    {{ message }}
	  </div>

	  <form @submit.prevent="handleEditUser">
	    <!-- Username -->
	    <label>Username</label>
	    <input
	      v-model="editForm.username"
	      type="text"
	      class="form-control mb-2"
	      placeholder="Username"
	      required
	    />

	    <!-- Email -->
	    <label>Email Address</label>
	    <input
	      v-model="editForm.email"
	      type="text"
	      class="form-control mb-3"
	      placeholder="Email Address"
	      required
	    />

	    <!-- Admin checkbox -->
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

	    <!-- Update Password checkbox -->
	    <div class="form-check mb-3">
		  <input
		    type="checkbox"
		    class="form-check-input"
		    id="updatePasswordCheckbox"
		    v-model="editForm.updatePassword"
		  />
		  <label class="form-check-label" for="updatePasswordCheckbox">
		    Update Password?
		  </label>
		</div>

	    <!-- Password fields, visible only if checkbox is ticked -->
	    <div v-if="editForm.updatePassword">
	      <label>New Password</label>
	      <input
	        v-model="editForm.password"
	        type="password"
	        class="form-control mb-2"
	        placeholder="New Password"
	        minlength="8"
	      />

	      <label>Confirm Password</label>
	      <input
	        v-model="editForm.confirmPassword"
	        type="password"
	        class="form-control mb-3"
	        placeholder="Confirm Password"
	        minlength="8"
	      />
	    </div>

	    <!-- Buttons -->
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
const updatePassword = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  isAdmin: false,
  updatePassword: false
})

const editForm = reactive({
  _id: '',
  username: '',
  email: '',
  isAdmin: false,
  updatePassword: false,
  password: '',
  confirmPassword: '',
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

    editForm.updatePassword = false
    editForm.password = ''
    editForm.confirmPassword = ''

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
    if (editForm.updatePassword) {
      // Check both fields are filled
      if (!editForm.password || !editForm.confirmPassword) {
        message.value = "Password cannot be blank."
        messageType.value = "error"
        setTimeout(() => { message.value = '' }, 2000)
        return
      }

      // Check they match
      if (editForm.password !== editForm.confirmPassword) {
        message.value = "Passwords do not match."
        messageType.value = "error"
        setTimeout(() => { message.value = '' }, 2000)
        return
      }
    } else {
      // If not updating password, remove it from payload
      editForm.password = ''
      editForm.confirmPassword = ''
    }

    await api.patch(`/users/edit/${editForm._id}`, editForm)

    message.value = 'User updated successfully. Redirecting...'
    messageType.value = 'success'

    setTimeout(() => {
      message.value = ''
      router.push('/users')
    }, 2000)

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

    setTimeout(() => {
	    message.value = ''
	  }, 2000)
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

const DeleteUser = async (user) => {
	if (!confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) return

		await api.delete(`/users/delete/${user._id}`)
	await fetchUsers()

	message.value = 'User deleted successfully.'
	messageType.value = 'success'

	setTimeout(() => {
		message.value = ''
	}, 2000)
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

watch(() => route.fullPath, fetchUsers)

onMounted(fetchUsers)
</script>