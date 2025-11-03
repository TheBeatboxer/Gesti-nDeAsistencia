import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

// Request interceptor to add token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if(token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor to handle 401 errors and prevent multiple redirects
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Clear localStorage only once to prevent multiple redirects
      if (!localStorage.getItem('redirecting')) {
        localStorage.setItem('redirecting', 'true');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        localStorage.removeItem('turno');
        // Use router.push instead of window.location.href for SPA navigation
        window.location.href = '/';
        setTimeout(() => localStorage.removeItem('redirecting'), 1000); // Reset flag after 1 second
      }
    }
    return Promise.reject(error);
  }
);
export default api;

