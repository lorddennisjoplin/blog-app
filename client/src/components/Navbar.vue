<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">

      <!-- Brand -->
      <RouterLink class="navbar-brand" to="/">
        Movies Catalogue
      </RouterLink>

      <!-- Hamburger (mobile) -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Nav Links -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">

		  <!-- Logged in -->
		  <template v-if="auth.isAuthenticated">

		    <li class="nav-item">
		      <RouterLink class="nav-link" to="/blogs">
		        <i class="bi bi-film"></i> All Blogs
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
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

import { useUserStore } from '../stores/user'

const auth = useUserStore()
const router = useRouter()

// Fetch cart on mount
onMounted(() => {
  // cartStore.fetchCart()
})

// Logout function
const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>