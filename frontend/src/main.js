import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './index.css';

// Set default timezone to America/Lima (Peru) for frontend date handling
import moment from 'moment-timezone';
moment.tz.setDefault('America/Lima');

createApp(App).use(router).mount('#app');
