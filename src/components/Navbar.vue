<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">

      <!-- Brand -->
      <RouterLink class="navbar-brand" to="/">
        Blog App
      </RouterLink>

      <!-- Hamburger (mobile) -->
      <button
        class="navbar-toggler"
        type="button"
        @click="isOpen = !isOpen"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Nav Links -->
      <div :class="['collapse', 'navbar-collapse', { show: isOpen }]">
        <ul class="navbar-nav ms-auto">

          <!-- Logged in -->
          <template v-if="auth.isAuthenticated">

            <li class="nav-item">
              <RouterLink class="nav-link" to="/posts">
                <i class="bi bi-journal-text"></i> All Posts
              </RouterLink>
            </li>

            <li v-if="auth.user" class="nav-item">
              <RouterLink class="nav-link" :to="`/posts/user/${auth.user.username}`">
                <i class="bi bi-pencil"></i> My Posts
              </RouterLink>
            </li>

            <li class="nav-item">
              <RouterLink class="nav-link" to="/posts/add">
                <i class="bi bi-plus-circle"></i> Add Post
              </RouterLink>
            </li>

            <li class="nav-item">
              <RouterLink class="nav-link" to="/profile">
                <i class="bi bi-person"></i> My Profile
              </RouterLink>
            </li>

            <li class="nav-item">
              <a class="nav-link text-danger" href="#" @click.prevent="logout">
                <i class="bi bi-x-octagon"></i> Log out
              </a>
            </li>

          </template>

          <!-- Not logged in -->
          <template v-else>

            <li class="nav-item">
              <RouterLink class="nav-link" to="/login">
                <i class="bi bi-lock"></i> Log in
              </RouterLink>
            </li>

            <li class="nav-item">
              <RouterLink class="nav-link" to="/register">
                <i class="bi bi-pencil-square"></i> Register
              </RouterLink>
            </li>

          </template>

        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const auth = useUserStore()
const router = useRouter()
const isOpen = ref(false)

// Collapse menu automatically on route change
watch(
  () => router.currentRoute.value.fullPath,
  () => {
    isOpen.value = false
  }
)

const logout = () => {
  auth.logout()
  router.push('/login')
  isOpen.value = false
}
</script>