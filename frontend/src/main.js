import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './index.css';

// Set default timezone to America/Lima (Peru) for frontend date handling
import moment from 'moment-timezone';
moment.tz.setDefault('America/Lima');

const app = createApp(App);

// Add global storage event listener to handle cross-tab session changes
window.addEventListener('storage', (event) => {
  if (event.key === 'token' || event.key === 'role') {
    // If token or role changed in another tab, check current session
    const currentToken = localStorage.getItem('token');
    const currentRole = localStorage.getItem('role');

    if (!currentToken) {
      // Token was removed in another tab, logout this tab too
      console.log('Session ended in another tab, logging out...');
      localStorage.clear();
      if (router.currentRoute.value.name !== 'Login') {
        router.push('/');
      }
    } else if (event.newValue !== event.oldValue) {
      // Session changed, validate current session
      console.log('Session changed in another tab, validating...');
      // Force a small delay to ensure the new session data is set
      setTimeout(() => {
        const newRole = localStorage.getItem('role');
        const currentRoute = router.currentRoute.value.name;

        // Check if current route matches the new role
        const roleRoutes = {
          'ADMIN': 'Admin',
          'ENCARGADO': 'Encargado',
          'WORKER': 'Worker'
        };

        if (newRole && roleRoutes[newRole] && currentRoute !== roleRoutes[newRole] && currentRoute !== 'Login') {
          console.log(`Redirecting from ${currentRoute} to ${roleRoutes[newRole]} due to session change`);
          router.push(`/${newRole.toLowerCase()}`);
        }
      }, 100);
    }
  }
});

app.use(router).mount('#app');
