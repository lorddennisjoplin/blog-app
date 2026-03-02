<template>
  <div class="container mt-5">
    <div class="col-md-6 mx-auto">
      <div class="card shadow p-4">
        <h1 class="mb-3">Log in</h1>

        <div v-if="error" class="alert alert-danger mb-3 py-2">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin">
          <input v-model="identifier" type="text" required class="form-control mb-3" placeholder="Username or Email Address" />
          <input v-model="password" type="password" required class="form-control mb-3" placeholder="Password" />

          <button
            type="submit"
            class="btn btn-primary w-100"
            :disabled="loading"
          >
            <span v-if="loading">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Loading...
            </span>
            <span v-else>
              Enter
            </span>
          </button>
        </form>

        <p class="mt-3">Don't have an account yet?
          <RouterLink to="/register">Go here</RouterLink> to register.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "../stores/user"
import api from "../services/api.js"

// ----- Form state -----
const loading = ref(false)
const identifier = ref("") // Can be email or username
const password = ref("")
const error = ref("")

// ----- Router & store -----
const router = useRouter()
const auth = useUserStore()

// ----- Login handler -----
const handleLogin = async () => {
  error.value = ""
  loading.value = true

  try {
    const res = await api.post("/users/login", {
      identifier: identifier.value, // <-- use identifier here
      password: password.value
    })

    // Save token to store and localStorage
    auth.setToken(res.data.access)
    localStorage.setItem("token", res.data.access)

    // Optionally store user info if returned
    if (res.data.user) {
      auth.setUser(res.data.user)
    }

    // Redirect after login
    router.push("/posts")
  } catch (err) {
    error.value = err?.response?.data?.message || err.message || "Log in failed."
  } finally {
    loading.value = false
  }
}
</script>