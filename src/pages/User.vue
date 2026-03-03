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

// Load current user data on mount
onMounted(() => {
  if (auth.user) {
    form.username = auth.user.username
    form.email = auth.user.email
  }
})

// Save profile function
const saveProfile = async () => {
  message.value = ''
  messageType.value = 'success'

  // Frontend validation
  if (!form.username || !form.email) {
    message.value = "Username and email are required."
    messageType.value = "error"
    return
  }

  if (updatePassword.value) {
    if (form.password.length < 8) {
      message.value = "Password must be at least 8 characters."
      messageType.value = "error"
      return
    }
    if (form.password !== form.confirmPassword) {
      message.value = "Passwords do not match."
      messageType.value = "error"
      return
    }
  }

  try {
    const payload = {
      username: form.username,
      email: form.email
    }
    if (updatePassword.value) {
      payload.password = form.password
    }

    const res = await api.put('/users/profile', payload)

    // Clear auth store so user is logged out
    auth.clearUser()

    // Show message and redirect after 5s
    message.value = "Profile updated successfully. Please log in again."
    messageType.value = "success"

    setTimeout(() => {
      router.push('/login')
    }, 5000)

    // Clear password fields
    form.password = ''
    form.confirmPassword = ''
    updatePassword.value = false

  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || "Failed to update profile."
    messageType.value = "error"
  }
}
</script>