import axios from 'axios';

// In development, Vite proxies /api/* to the backend (see vite.config.ts).
// In production, set VITE_API_URL to your backend URL (e.g. https://api.nebula.io/api/v1).
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ── Request interceptor: inject access token from memory ──
apiClient.interceptors.request.use((config) => {
  // The auth context sets the token via setAuthToken() below
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── In-memory access token store ──
// The access token lives ONLY in memory (not localStorage) for XSS safety.
// The refresh token lives in localStorage for cross-tab / page-reload persistence.
let _accessToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  _accessToken = token;
};

export const getAuthToken = (): string | null => _accessToken;

// ── Response interceptor: silent refresh on 401 ──
let _isRefreshing = false;
let _pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  _pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  _pendingRequests = [];
};

// This callback is set by AuthContext to trigger logout when refresh fails
let _onRefreshFailure: (() => void) | null = null;

export const setRefreshFailureCallback = (cb: () => void) => {
  _onRefreshFailure = cb;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt silent refresh on 401 responses, and only once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (_isRefreshing) {
        // Queue this request until the refresh finishes
        return new Promise((resolve, reject) => {
          _pendingRequests.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      _isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('nebula_refresh_token');
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        // Use a plain axios call to avoid interceptor recursion
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const newAccessToken: string = data.accessToken;
        const newRefreshToken: string = data.refreshToken;

        setAuthToken(newAccessToken);
        localStorage.setItem('nebula_refresh_token', newRefreshToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAuthToken(null);
        localStorage.removeItem('nebula_refresh_token');
        _onRefreshFailure?.();
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
