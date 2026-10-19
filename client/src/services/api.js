import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Phase 2 JWT authentication tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stayeasy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error transformation
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let message = error.response?.data?.message;
    if (!message) {
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        message = `Cannot reach StayEasy API server at ${API_BASE_URL}. Please ensure the backend server is running.`;
      } else {
        message = error.message || 'Unable to communicate with StayEasy server';
      }
    }
    const customError = {
      message,
      status: error.response?.status || 500,
      details: error.response?.data?.errors || null,
      isNetworkError: !error.response,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
