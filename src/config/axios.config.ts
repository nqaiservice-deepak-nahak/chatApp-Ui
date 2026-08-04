import axios, { InternalAxiosRequestConfig } from 'axios';
import { environment } from '../environments/environment';
import { AppApiResponse } from '../@types';
import { API_ENDPOINTS } from '../shared/api-endpoints';
import {
  clearStoredSession,
  getStoredRefreshToken,
  getStoredToken,
  updateStoredTokens
} from '../shared/shared-functions';

/**
 * Central Axios instance, mirroring the reference project's
 * config/axios.config.ts. Every request automatically gets the JWT
 * attached. A 401 first refreshes the access token and retries the original
 * request; the session is cleared only when refresh is unavailable or expired.
 */
const API = axios.create({
  baseURL: environment.API_URL
});

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<string> | null = null;

const redirectToLogin = () => {
  clearStoredSession();
  if (window.location.pathname !== '/login') window.location.href = '/login';
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error('No refresh token is available.');

  const response = await axios.post<AppApiResponse<{ accessToken: string; refreshToken: string }>>(
    `${environment.API_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
    { refreshToken }
  );
  const tokens = response.data.data;
  if (!tokens?.accessToken || !tokens.refreshToken) {
    throw new Error('The refresh response did not contain valid tokens.');
  }

  updateStoredTokens(tokens.accessToken, tokens.refreshToken);
  window.dispatchEvent(new CustomEvent('auth:tokens-refreshed', { detail: tokens.accessToken }));
  return tokens.accessToken;
};

API.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error?.config as RetryableRequest | undefined;
    const isAuthRequest = request?.url?.includes(API_ENDPOINTS.LOGIN) || request?.url?.includes(API_ENDPOINTS.REFRESH_TOKEN);

    if (error?.response?.status !== 401 || !request || request._retry || isAuthRequest) {
      if (error?.response?.status === 401 && (!request || request._retry)) redirectToLogin();
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;
      request.headers.set('Authorization', `Bearer ${accessToken}`);
      return API(request);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default API;
