import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";

import Login from "../pages/LoginPage.vue";
import Register from "../pages/RegisterPage.vue";
import Blogs from "../pages/Blogs.vue";
import AddBlog from "../pages/AddBlog.vue";
import EditBlog from "../pages/EditBlog.vue";
// import User from "../pages/User.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/posts", component: Blogs },
  { path: "/posts/add", component: AddBlog },
  { path: "/posts/user/:username?", component: Blogs },
  { path: "/posts/view/:id", component: EditBlog },
  { path: "/posts/edit/:id", component: EditBlog },
  // { path: "/user", component: User },
  { path: "/", redirect: "/posts" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useUserStore();

  // // If already logged in, just go to /products
  if (auth.isAuthenticated && (to.path === "/login" || to.path === "/register")) {
    return next("/posts");
  }

  const protectedRoutes = ["/posts/blog"];

  if (
    !auth.isAuthenticated &&
    protectedRoutes.some(route => to.path.startsWith(route))
  ) {
    return next("/login");
  }

  next();
});

export default router;