import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { store } from "@/store";
import { refreshToken, clearAuth } from "@/store/slices/authSlice";
import { getVisitorId } from "@/lib/visitor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

// Request interceptor - add auth token + visitor id
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const visitorId = getVisitorId();
    if (visitorId && config.headers) {
      config.headers["X-Visitor-Id"] = visitorId;
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
        // Clear tokens from storage - let components handle showing auth modal
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          // Dispatch custom event so components can react
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
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

// Attach visitor id + optional auth token on every public request
publicClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { _skipAuth?: boolean }) => {
    if (typeof window !== "undefined") {
      if (!config._skipAuth) {
        const token = localStorage.getItem("access_token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      const visitorId = getVisitorId();
      if (visitorId && config.headers) {
        config.headers["X-Visitor-Id"] = visitorId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// If a public request gets 401 (expired token), retry WITHOUT auth — data is public
publicClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number; _skipAuth?: boolean; _authRetried?: boolean };

    if (error.response?.status === 401 && config && !config._authRetried) {
      config._authRetried = true;
      config._skipAuth = true;
      if (config.headers) {
        delete config.headers.Authorization;
      }
      return publicClient(config);
    }

    return Promise.reject(error);
  }
);

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
