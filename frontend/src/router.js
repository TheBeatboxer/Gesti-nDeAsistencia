import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/Login.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import EncargadoPanel from './components/EncargadoPanel.vue';
import WorkerDashboard from './components/WorkerDashboard.vue';

// Navigation guard to check authentication
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (!token) {
    next('/');
  } else {
    next();
  }
};

const routes = [
  { path: '/', component: Login, name: 'Login' },
  { path: '/admin', component: AdminDashboard, name: 'Admin', beforeEnter: requireAuth },
  { path: '/encargado', component: EncargadoPanel, name: 'Encargado', beforeEnter: requireAuth },
  { path: '/worker', component: WorkerDashboard, name: 'Worker', beforeEnter: requireAuth }
];

const router = createRouter({ history: createWebHistory(), routes });

// Global navigation guard to prevent multiple sessions
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (to.name === 'Login') {
    if (token) {
      // If already logged in, redirect to appropriate dashboard
      if (role === 'ADMIN') next('/admin');
      else if (role === 'ENCARGADO') next('/encargado');
      else next('/worker');
    } else {
      next();
    }
  } else {
    // For protected routes, check if user has correct role
    if (!token) {
      next('/');
    } else {
      const allowedRoutes = {
        'ADMIN': ['Admin'],
        'ENCARGADO': ['Encargado'],
        'WORKER': ['Worker']
      };
      if (allowedRoutes[role] && allowedRoutes[role].includes(to.name)) {
        next();
      } else {
        // Redirect to correct dashboard if wrong route
        if (role === 'ADMIN') next('/admin');
        else if (role === 'ENCARGADO') next('/encargado');
        else next('/worker');
      }
    }
  }
});

export default router;
