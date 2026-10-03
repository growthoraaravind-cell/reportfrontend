import api from '../lib/api';
import type { ApiEnvelope, Scheme, SchemeImportPreview, SchemeImportResult } from '../lib/types';

export interface SchemeFilters {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  level?: string;
  category?: string;
  stateFilter?: string;
  isPublished?: string;
  isComplete?: string;
}

export async function fetchSchemes(filters: SchemeFilters = {}) {
  const response = await api.get<ApiEnvelope<Scheme[]>>('/admin/schemes', { params: filters });
  return { schemes: response.data.data, ...(response.data.meta || {}) };
}

export async function fetchScheme(id: string) {
  const response = await api.get<ApiEnvelope<Scheme>>(`/admin/schemes/${encodeURIComponent(id)}`);
  return response.data.data;
}

export async function saveScheme(scheme: Partial<Scheme> & Pick<Scheme, 'schemeId' | 'name'>, id?: string) {
  const response = id
    ? await api.put<ApiEnvelope<Scheme>>(`/admin/schemes/${encodeURIComponent(id)}`, scheme)
    : await api.post<ApiEnvelope<Scheme>>('/admin/schemes', scheme);
  return response.data.data;
}

export async function setSchemePublished(id: string, isPublished: boolean) {
  const response = await api.patch<ApiEnvelope<Scheme>>(`/admin/schemes/${encodeURIComponent(id)}/publish`, { isPublished });
  return response.data.data;
}

export async function removeScheme(id: string) {
  await api.delete(`/admin/schemes/${encodeURIComponent(id)}`);
}

export async function previewSchemeWorkbook(file: File, onProgress: (progress: number) => void) {
  const form = new FormData(); form.append('files', file);
  const response = await api.post<ApiEnvelope<SchemeImportPreview>>('/admin/schemes/import/preview', form, {
    onUploadProgress: (event) => onProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
  });
  return response.data.data;
}

export async function importSchemeWorkbook(fileId: string, mode: 'skip' | 'update') {
  const response = await api.post<ApiEnvelope<SchemeImportResult>>('/admin/schemes/import', { fileId, mode });
  return response.data.data;
}

export async function downloadSchemeWorkbook() {
  const response = await api.get('/admin/schemes/export', { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'growthora-schemes.xlsx'; anchor.click();
  URL.revokeObjectURL(url);
}