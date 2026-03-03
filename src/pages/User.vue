<template>
  <div class="container my-5" style="max-width: 600px;">
    <h1 class="mb-4">My Profile</h1>

    <div v-if="loading" class="alert alert-info">Loading...</div>

    <div v-else>

      <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-danger' : 'alert-success']">
        {{ message }}
      </div>

      <form @submit.prevent="updateProfile">

        <div class="mb-3">
          <label class="form-label">Username</label>
          <input
            v-model="form.username"
            type="text"
            class="form-control"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="form-control"
            required
          />
        </div>

        <!-- Update Password Toggle -->
		<div class="form-check mb-3">
		  <input
		    class="form-check-input"
		    type="checkbox"
		    id="updatePassword"
		    v-model="updatePassword"
		  />
		  <label class="form-check-label" for="updatePassword">
		    Update Password?
		  </label>
		</div>

		<!-- Password Fields -->
		<div v-if="updatePassword">
		  <div class="mb-3">
		    <label class="form-label">New Password</label>
		    <input
		      v-model="form.password"
		      type="password"
		      class="form-control"
		      minlength="8"
		    />
		  </div>

		  <div class="mb-3">
		    <label class="form-label">Confirm Password</label>
		    <input
		      v-model="form.confirmPassword"
		      type="password"
		      class="form-control"
		      minlength="8"
		    />
		  </div>
		</div>

        <button class="btn btn-primary" :disabled="updating">
          <span v-if="updating">
            <span class="spinner-border spinner-border-sm me-1"></span>
            Saving...
          </span>
          <span v-else>Save Changes</span>
        </button>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../services/api'
import { useUserStore } from '../stores/user'

const auth = useUserStore()

const loading = ref(true)
const updating = ref(false)
const message = ref('')
const messageType = ref('success')
const updatePassword = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const fetchProfile = async () => {
  try {
    const res = await api.get('/users/details', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })

    form.username = res.data.user.username
    form.email = res.data.user.email

  } catch (err) {
    message.value = err.response?.data?.message || "Failed to load profile."
    messageType.value = "error"
  } finally {
    loading.value = false
  }
}

const updateProfile = async () => {
  try {
    updating.value = true
    message.value = ''

    // Password validation
    if (updatePassword.value) {
      if (!form.password || form.password.length < 6) {
        message.value = "Password must be at least 6 characters."
        messageType.value = "error"
        updating.value = false
        return
      }

      if (form.password !== form.confirmPassword) {
        message.value = "Passwords do not match."
        messageType.value = "error"
        updating.value = false
        return
      }
    }

    const payload = {
      username: form.username,
      email: form.email
    }

    // Only include password if checkbox checked
    if (updatePassword.value) {
      payload.password = form.password
    }

    const res = await api.patch(
      '/users/profile',
      payload,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )

    auth.setUser(res.data.user)

    message.value = "Profile updated successfully."
    messageType.value = "success"

    // Reset password fields
    updatePassword.value = false
    form.password = ''
    form.confirmPassword = ''

    setTimeout(() => {
      message.value = ''
    }, 2000)

  } catch (err) {
    message.value = err.response?.data?.message || "Update failed."
    messageType.value = "error"
  } finally {
    updating.value = false
  }
}

onMounted(fetchProfile)
</script>