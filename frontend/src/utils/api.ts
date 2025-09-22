import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import * as Sentry from '@sentry/react';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with Sentry performance tracking
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Start Sentry span for API call tracking
    const span = Sentry.startInactiveSpan({
      op: 'http.client',
      name: `${config.method?.toUpperCase()} ${config.url}`,
    });

    // Attach span to config for use in response interceptor
    config.metadata = { sentrySpan: span };

    return config;
  },
  (error) => {
    Sentry.captureException(error);
    return Promise.reject(error);
  }
);

// Response interceptor with error handling and Sentry tracking
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Finish Sentry span on successful response
    const span = response.config.metadata?.sentrySpan;
    if (span) {
      span.setStatus({ code: 1, message: 'ok' }); // Success
      span.setAttribute('http.status_code', response.status);
      span.end();
    }

    return response;
  },
  (error: AxiosError) => {
    // Finish Sentry span on error response
    const span = error.config?.metadata?.sentrySpan;
    if (span) {
      span.setStatus({ code: 2, message: 'error' }); // Error
      span.setAttribute('http.status_code', error.response?.status || 0);
      span.setAttribute('http.response_size', error.response?.data ? JSON.stringify(error.response.data).length : 0);
      span.end();
    }

    // Log error to Sentry with context
    Sentry.withScope((scope) => {
      scope.setTag('api.method', error.config?.method?.toUpperCase());
      scope.setTag('api.url', error.config?.url);
      scope.setTag('api.status', error.response?.status);
      scope.setContext('API Error', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      Sentry.captureException(error);
    });

    // Handle auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Helper functions for different HTTP methods with Sentry tracking
export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return Sentry.startSpan(
      {
        op: 'http.client',
        name: `GET ${url}`,
      },
      async () => {
        const response = await api.get<T>(url, config);
        return response.data;
      }
    );
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return Sentry.startSpan(
      {
        op: 'http.client',
        name: `POST ${url}`,
      },
      async () => {
        const response = await api.post<T>(url, data, config);
        return response.data;
      }
    );
  },

  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return Sentry.startSpan(
      {
        op: 'http.client',
        name: `PUT ${url}`,
      },
      async () => {
        const response = await api.put<T>(url, data, config);
        return response.data;
      }
    );
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return Sentry.startSpan(
      {
        op: 'http.client',
        name: `DELETE ${url}`,
      },
      async () => {
        const response = await api.delete<T>(url, config);
        return response.data;
      }
    );
  },
};

// Extend axios request config type to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      sentrySpan?: any;
    };
  }
}

export default api;