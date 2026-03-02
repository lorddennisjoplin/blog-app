<template>
  <div class="container my-5">
    <div class="col-md-6 mx-auto">
      <div class="card shadow p-4">
        <h1 class="mb-3">Register</h1>

        <div 
          v-if="message" 
          :class="[
            'alert mb-3 py-2',
            messageType === 'success' ? 'alert-success' : 'alert-danger'
          ]"
        >
          {{ message }}
        </div>

        <form @submit.prevent="handleRegister">
          <p class="small">All fields are required.</p>
          <input v-model="form.username" class="form-control mb-2" type="text" placeholder="Display Name *" required />
          <input v-model="form.email" class="form-control mb-2" type="email" placeholder="Email Address *" required />
          <input v-model="form.password" type="password" class="form-control mb-2" minlength="8" placeholder="Password (At least 8 characters)" required />
          <input v-model="form.confirmPassword" type="password" class="form-control mb-3" minlength="8" placeholder="Confirm Password" required />

          <button 
            class="btn btn-primary w-100"
            :disabled="loading"
          >
            {{ loading ? "Loading..." : "Register" }}
          </button>
        </form>

        <p class="mt-3">
          Already have an account?
          <RouterLink to="/login">Go here</RouterLink> to log in.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import api from '../services/api.js'; 

const router = useRouter()

const message = ref("")
const messageType = ref("")
const loading = ref(false)

const form = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: ""
})

const handleRegister = async () => {
  message.value = ""
  messageType.value = ""

  if (form.password !== form.confirmPassword) {
    message.value = "Passwords do not match."
    messageType.value = "error"
    return
  }

  loading.value = true

  try {
    const res = await api.post("/users/register", {
      name: form.name,
      email: form.email,
      password: form.password
    })

    message.value = res.data.message
    messageType.value = "success"

    setTimeout(() => {
      router.push("/login")
    }, 1000)

  } catch (err) {
    message.value = err.response?.data?.message || "Registration failed."
    messageType.value = "error"
  } finally {
    loading.value = false
  }
}
</script>