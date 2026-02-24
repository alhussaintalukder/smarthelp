/**
 * Axios instance with interceptors.
 *
 * Used for external API calls (e.g., Agora token server, FCM HTTP API).
 * Base URL can be configured when a backend is set up.
 */

import axios from 'axios';

const api = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token if needed
api.interceptors.request.use(
  (config) => {
    // TODO: In production, attach a Firebase ID token for authenticated requests:
    // const token = await getFirebaseAuth().currentUser?.getIdToken();
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `API Error ${error.response.status}:`,
        error.response.data
      );
    } else if (error.request) {
      console.error('API Error: No response received', error.message);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
