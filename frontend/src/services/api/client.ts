import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { store } from "@/store";
import { refreshToken, clearAuth } from "@/store/slices/authSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Retry configuration for handling cold starts
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Create axios instance with longer timeout for cold starts
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds to handle cold starts
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err: Error) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const result = await store.dispatch(refreshToken()).unwrap();
        const newToken = result.access;

        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(new Error("Token refresh failed"));
        store.dispatch(clearAuth());
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Alias for authenticated client
export const authClient = apiClient;

// Public client (no auth required) with retry logic for cold starts
export const publicClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds to handle cold starts
});

// Add retry interceptor for network errors (cold starts)
publicClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Only retry on network errors or 5xx errors (not 4xx)
    const shouldRetry =
      !error.response || // Network error
      (error.response.status >= 500 && error.response.status < 600); // Server error

    if (shouldRetry && config && (config._retryCount || 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount || 0) + 1;

      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);
      console.log(`Retrying request (attempt ${config._retryCount}/${MAX_RETRIES}) after ${delay}ms...`);

      await sleep(delay);
      return publicClient(config);
    }

    return Promise.reject(error);
  }
);
