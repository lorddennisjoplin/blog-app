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

const form = reactive({
  username: '',
  email: ''
})

const fetchProfile = async () => {
  try {
    const res = await api.get('/users/profile', {
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

    const res = await api.patch(
      '/users/profile',
      {
        username: form.username,
        email: form.email
      },
      {
        headers: { Authorization: `Bearer ${auth.token}` }
      }
    )

    auth.setUser(res.data.user) // update store

    message.value = "Profile updated successfully."
    messageType.value = "success"

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