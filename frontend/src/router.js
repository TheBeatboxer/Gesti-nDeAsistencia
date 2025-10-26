import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/Login.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import EncargadoPanel from './components/EncargadoPanel.vue';
import WorkerDashboard from './components/WorkerDashboard.vue';

const routes = [
  { path: '/', component: Login, name: 'Login' },
  { path: '/admin', component: AdminDashboard, name: 'Admin' },
  { path: '/encargado', component: EncargadoPanel, name: 'Encargado' },
  { path: '/worker', component: WorkerDashboard, name: 'Worker' }
];

const router = createRouter({ history: createWebHistory(), routes });
export default router;
