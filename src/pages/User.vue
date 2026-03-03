<template>
  <div class="container my-5">
    <h1 class="mb-4">Edit Profile</h1>

    <div v-if="message" :class="`alert mb-3 py-2 ${messageType === 'success' ? 'alert-success' : 'alert-danger'}`">
      {{ message }}
    </div>

    <form @submit.prevent="saveProfile" class="w-100" style="max-width: 500px;">
      <!-- Username -->
      <div class="mb-3">
        <label class="form-label">Username</label>
        <input type="text" v-model="form.username" class="form-control" required />
      </div>

      <!-- Email -->
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" v-model="form.email" class="form-control" required />
      </div>

      <!-- Update Password Checkbox -->
      <div class="mb-3 form-check">
        <input type="checkbox" class="form-check-input" id="updatePassword" v-model="updatePassword" />
        <label class="form-check-label" for="updatePassword">Update Password?</label>
      </div>

      <!-- Password fields (only if checkbox is checked) -->
      <div v-if="updatePassword">
        <div class="mb-3">
          <label class="form-label">New Password</label>
          <input type="password" v-model="form.password" class="form-control" placeholder="At least 8 characters" />
        </div>

        <div class="mb-3">
          <label class="form-label">Confirm Password</label>
          <input type="password" v-model="form.confirmPassword" class="form-control" placeholder="Confirm new password" />
        </div>
      </div>

      <button type="submit" class="btn btn-primary" :disabled="loading">
		  {{ loading ? 'Saving...' : 'Save Changes' }}
		</button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../services/api.js'
import { useUserStore } from '../stores/user.js'
import { useRouter } from 'vue-router'

const auth = useUserStore()
const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const updatePassword = ref(false)
const message = ref('')
const messageType = ref('success')
const loading = ref(false)

// Load current user data on mount
onMounted(async () => {
  try {
    if (auth.user) {
      form.username = auth.user.username
      form.email = auth.user.email
      return
    }

    if (auth.token) {
      const res = await api.get('/users/profile', {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      form.username = res.data.user.username
      form.email = res.data.user.email
      auth.setUser(res.data.user)
      return
    }

    router.push('/login') // Only redirect if no token
  } catch (err) {
    console.error(err)
    auth.logout()
    router.push('/login')
  }
})

// Save profile function
const saveProfile = async () => {
  if (!form.username || !form.email) {
    message.value = "Username and email are required.";
    messageType.value = "error";
    return;
  }

  // Password confirmation check
  if (updatePassword.value && form.password !== form.confirmPassword) {
    message.value = "Passwords do not match.";
    messageType.value = "error";
    return;
  }

  try {
    loading.value = true;

    const res = await api.patch(
      '/users/profile', // PATCH matches backend route
      {
        username: form.username,
        email: form.email,
        password: updatePassword.value ? form.password : undefined
      },
      {
        headers: { Authorization: `Bearer ${auth.token}` }
      }
    );

    message.value = "Profile updated successfully. Please log in again.";
    messageType.value = "success";

    setTimeout(() => {
      auth.logout();         // clear user data
      router.push('/login'); // redirect to login
    }, 2500);

  } catch (err) {
    console.error(err);
    message.value = err.response?.data?.message || "Failed to update profile.";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};
</script>