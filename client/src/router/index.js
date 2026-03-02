import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";

import Login from "../pages/LoginPage.vue";
import Register from "../pages/RegisterPage.vue";
import Movies from "../pages/Movies.vue";
import EditWorkout from "../pages/EditMovie.vue";
// import User from "../pages/User.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/movies", component: Movies },
  { path: "/movies/movie/:id", component: EditWorkout },
  // { path: "/user", component: User },
  { path: "/", redirect: "/movies" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useUserStore();

  // // If already logged in, just go to /products
  if (auth.isAuthenticated && (to.path === "/login" || to.path === "/register")) {
    return next("/movies");
  }

  const protectedRoutes = ["/movies/movie"];

  if (
    !auth.isAuthenticated &&
    protectedRoutes.some(route => to.path.startsWith(route))
  ) {
    return next("/login");
  }

  next();
});

export default router;