import axios from 'axios';
import { RegisterPayload } from '../types/auth';

// Base URL untuk FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor untuk menambahkaKn token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API Endpoints
export const chatAPI = {
  sendMessage: async (message: string, conversationId?: string) => {
    const response = await apiClient.post('/api/chat', {
      message,
      conversation_id: conversationId,
    });
    return response.data;
  },
  
  getConversations: async () => {
    const response = await apiClient.get('/api/chat/conversations');
    return response.data;
  },
};

export const telegramAPI = {
  activateBot: async (userId: string) => {
    const response = await apiClient.post('/api/telegram/activate', {
      user_id: userId,
    });
    return response.data;
  },
  
  getStatus: async () => {
    const response = await apiClient.get('/api/telegram/status');
    return response.data;
  },
};

export const topsisAPI = {
  uploadExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/topsis/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getRankings: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get('/api/topsis/rankings', {
      params: { page, limit },
    });
    return response.data;
  },
  
  exportExcel: async () => {
    const response = await apiClient.get('/api/topsis/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },
  
  register: async (userData: RegisterPayload ) => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },
};