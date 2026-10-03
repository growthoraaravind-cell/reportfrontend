import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiEnvelope } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  timeout: 30_000,
});

function getVisitorId(): string {
  const key = 'growthora.visitorId';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set('X-Visitor-Id', getVisitorId());
  const token = localStorage.getItem('growthora.adminToken');
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

api.interceptors.response.use((response) => response, (error: AxiosError) => {
  if (error.response?.status === 401 && localStorage.getItem('growthora.adminToken') && !error.config?.url?.includes('/admin/auth/login')) {
    localStorage.removeItem('growthora.adminToken');
    localStorage.removeItem('growthora.adminUser');
    window.location.assign('/admin/login');
  }
  return Promise.reject(error);
});

export function visitorId(): string {
  return getVisitorId();
}

export async function getData<T>(url: string, params?: Record<string, string | number>) {
  const response = await api.get<ApiEnvelope<T>>(url, { params });
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'The API returned an unexpected response.');
  }
  return response.data.data;
}

export async function postData<T>(url: string, body: unknown) {
  const response = await api.post<ApiEnvelope<T>>(url, body);
  return response.data.data;
}

export function apiError(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string; meta?: { errors?: Array<{ message?: string }> } }>;
  if (axiosError.code === 'ECONNABORTED' || /timeout/i.test(axiosError.message || '')) {
    return 'This review took longer than expected. Try again with fewer links, or review your website and social profiles separately.';
  }
  return axiosError.response?.data?.meta?.errors?.[0]?.message
    || axiosError.response?.data?.message
    || axiosError.message
    || 'Something went wrong. Please try again.';
}

export async function track(type: string, path: string, meta?: Record<string, unknown>) {
  await api.post('/track', { visitorId: getVisitorId(), type, path, meta, referrer: document.referrer });
}

export default api;