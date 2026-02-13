import type { AdminRole } from '@app/shared';

import { apiClient } from './client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export interface AdminListResponse {
  admins: AdminUser[];
  total: number;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
}

export interface UpdateAdminRequest {
  name?: string;
  role?: AdminRole;
}

export const adminsApi = {
  list(): Promise<AdminListResponse> {
    return apiClient.get<AdminListResponse>('/admins');
  },

  create(data: CreateAdminRequest): Promise<AdminUser> {
    return apiClient.post<AdminUser>('/admins', data);
  },

  update(id: string, data: UpdateAdminRequest): Promise<AdminUser> {
    return apiClient.put<AdminUser>(`/admins/${id}`, data);
  },

  remove(id: string): Promise<{ success: true }> {
    return apiClient.delete<{ success: true }>(`/admins/${id}`);
  },
};
