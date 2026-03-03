<template>
  <div class="container my-5">
    <h1 class="mb-4">My Profile</h1>

    <!-- User Details -->
    <p><strong>Username:</strong> {{ auth.user?.username || '-' }}<br>
    <strong>Email Address:</strong> {{ auth.user?.email || '-' }}</p>
    <template v-if="postCount > 0">
    	<RouterLink
    	:to="`/posts/user/${auth.user?.username}`"
    	class="text-decoration-none fw-bold"
    	>
    	<button class="btn btn-success">
    		View {{ postCount }} Post{{ postCount > 1 ? 's' : '' }}
    	</button>
    </RouterLink>
	</template>
	<template v-else>
		<RouterLink to="/posts/add">
			<button class="btn btn-success">Add Post</button>
		</RouterLink>
	</template>

  <button
    :class="[
      'btn ms-2',
      isEditing ? 'btn-secondary' : 'btn-primary'
    ]"
    @click="isEditing = !isEditing"
  >
    {{ isEditing ? 'Cancel Edit' : 'Edit Profile' }}
  </button>

  <div v-if="isEditing">

    <hr class="my-4">

    <h2 class="mb-3">Edit Profile</h2>

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
        <label class="form-label">Email Address</label>
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

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
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
const isEditing = ref(false)

const postCount = ref(0)

// Load current user data and post count
onMounted(async () => {
  try {
    if (auth.user) {
      form.username = auth.user.username
      form.email = auth.user.email
      await fetchPostCount()
      return
    }

    if (auth.token) {
      const res = await api.get('/users/profile', {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      form.username = res.data.user.username
      form.email = res.data.user.email
      auth.setUser(res.data.user)
      await fetchPostCount()
      return
    }

    router.push('/login') // redirect if no token
  } catch (err) {
    console.error(err)
    auth.logout()
    router.push('/login')
  }
})

// Fetch number of posts for the user
const fetchPostCount = async () => {
  try {
    const res = await api.get(`/posts/user/${auth.user.username}`)
    postCount.value = res.data.blogs?.length || 0
  } catch (err) {
    console.error("Failed to fetch post count:", err)
    postCount.value = 0
  }
}


// Save profile function
const saveProfile = async () => {
  if (!form.username || !form.email) {
    message.value = "Username and email are required.";
    messageType.value = "error";
    return;
  }

  if (updatePassword.value && form.password !== form.confirmPassword) {
    message.value = "Passwords do not match.";
    messageType.value = "error";
    return;
  }

  try {
    loading.value = true;

    const res = await api.patch(
      '/users/profile',
      {
        username: form.username,
        email: form.email,
        password: updatePassword.value ? form.password : undefined
      },
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );

    message.value = "Profile updated successfully. Please log in again.";
    messageType.value = "success";

    setTimeout(() => {
      auth.logout()
      router.push('/login')
    }, 2000);

  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || "Failed to update profile."
    messageType.value = "error"
  } finally {
    loading.value = false
  }
}
</script>