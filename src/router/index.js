import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";

import Login from "../pages/LoginPage.vue";
import Register from "../pages/RegisterPage.vue";
import Profile from "../pages/ProfilePage.vue";
import Users from "../pages/UsersPage.vue";
import Blogs from "../pages/Blogs.vue";
import AddBlog from "../pages/AddBlog.vue";
import EditBlog from "../pages/EditBlog.vue";
// import User from "../pages/User.vue";

const routes = [
  { path: "/login", component: Login, meta: { title: "Login | Blog App" } },
  { path: "/register", component: Register, meta: { title: "Register | Blog App" } },
  { path: "/profile", component: Profile, meta: { title: "My Profile | Blog App" } },
  { path: "/users", component: Users, meta: { title: "All Users | Blog App" } },
  { path: "/posts", component: Blogs, meta: { title: "All Posts | Blog App" } },
  { path: "/posts/add", component: AddBlog, meta: { title: "Add Post | Blog App" } },
  { path: "/posts/user/:username?", component: Blogs, meta: { title: "User's Posts | Blog App" } },
  { path: "/posts/view/:id", component: EditBlog, meta: { title: "View Post | Blog App" } },
  { path: "/posts/edit/:id", component: EditBlog, meta: { title: "Edit Your Post | Blog App" } },
  // { path: "/user", component: User, meta: { title: "User Profile | Blog App" } },
  { path: "/", redirect: "/posts", meta: { title: "All Posts | Blog App" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // If a hash is present, scroll to it
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth", // optional, smooth scroll
      };
    }
    // If coming back with browser back/forward
    if (savedPosition) {
      return savedPosition;
    }
    // Default scroll
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (to.meta.title && !to.meta.title.includes("{")) {
    // static titles
    document.title = to.meta.title;
  }
});

router.beforeEach((to, from, next) => {
  const auth = useUserStore();

  // // If already logged in, just go to /products
  if (auth.isAuthenticated && (to.path === "/login" || to.path === "/register")) {
    return next("/posts");
  }

  const protectedRoutes = ["/posts/view","/posts/add","/posts/edit","/posts/delete"];

  if (
    !auth.isAuthenticated &&
    protectedRoutes.some(route => to.path.startsWith(route))
  ) {
    return next("/login");
  }

  next();
});

export default router;