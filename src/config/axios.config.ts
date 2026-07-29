import axios from 'axios';
import { environment } from '../environments/environment';
import { clearStoredSession, getStoredToken } from '../shared/shared-functions';

/**
 * Central Axios instance, mirroring the reference project's
 * config/axios.config.ts. Every request automatically gets the JWT
 * attached; a 401 response automatically clears the session and sends
 * the user back to /login.
 */
const API = axios.create({
  baseURL: environment.API_URL
});

API.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
