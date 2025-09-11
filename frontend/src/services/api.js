import axios from 'axios';
import { toast } from 'react-hot-toast';
import { autoDetectBackendUrl } from '../utils/networkUtils';

// Dynamic API URL detection
let apiBaseURL = null;

const initializeApi = async () => {
  if (!apiBaseURL) {
    apiBaseURL = await autoDetectBackendUrl();
  }
  return apiBaseURL;
};

// Create axios instance with dynamic URL
const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set base URL dynamically
initializeApi().then(url => {
  api.defaults.baseURL = url;
  console.log('🔗 API Base URL set to:', url);
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;

    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`,
        response.data
      );
    }

    return response;
  },
  (error) => {
    // Calculate request duration if available
    const duration = error.config?.metadata?.startTime 
      ? new Date() - error.config.metadata.startTime 
      : 0;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`,
        error.response?.data || error.message
      );
    }

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          
          // Only show toast if not already on login page
          if (!window.location.pathname.includes('/login')) {
            toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            // Redirect to login after a short delay
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          }
          break;
          
        case 403:
          toast.error('Bu işlem için yetkiniz bulunmuyor.');
          break;
          
        case 404:
          toast.error('İstenen kaynak bulunamadı.');
          break;
          
        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => {
              toast.error(err.message || err);
            });
          } else {
            toast.error(data.message || 'Girilen bilgiler geçersiz.');
          }
          break;
          
        case 429:
          toast.error('Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.');
          break;
          
        case 500:
          toast.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
          break;
          
        default:
          toast.error(data.message || 'Bir hata oluştu.');
      }
    } else if (error.request) {
      // Network error
      if (error.code === 'ECONNABORTED') {
        toast.error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else {
        toast.error('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
      }
    } else {
      // Something else happened
      toast.error('Beklenmeyen bir hata oluştu.');
    }

    return Promise.reject(error);
  }
);

// Helper functions for common API operations
export const apiHelpers = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  },

  // Remove auth token
  removeAuthToken: () => {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  },

  // Upload file with progress
  uploadFile: (url, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  // Download file
  downloadFile: async (url, filename) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });

      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename || 'download';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(link.href);
      
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Dosya indirilemedi.');
      return { success: false, error };
    }
  },

  // Retry failed request
  retryRequest: (originalRequest, maxRetries = 3, delay = 1000) => {
    return new Promise((resolve, reject) => {
      let retries = 0;
      
      const attemptRequest = () => {
        api(originalRequest)
          .then(resolve)
          .catch((error) => {
            retries++;
            if (retries < maxRetries && error.response?.status >= 500) {
              setTimeout(attemptRequest, delay * retries);
            } else {
              reject(error);
            }
          });
      };
      
      attemptRequest();
    });
  },

  // Check if request should be retried
  shouldRetry: (error) => {
    return (
      error.response?.status >= 500 ||
      error.code === 'ECONNABORTED' ||
      error.code === 'NETWORK_ERROR'
    );
  },

  // Format API error for display
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Bilinmeyen bir hata oluştu';
  },

  // Check if user is online
  checkConnection: async () => {
    try {
      await api.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  },
};

// Export auth token helpers
export const { setAuthToken, removeAuthToken } = apiHelpers;

// Export default api instance
export default api;