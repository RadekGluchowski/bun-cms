import type { LoginResponse, MeResponse } from '@/types/auth.types';
import { apiClient } from './client';

interface LoginCredentials {
    email: string;
    password: string;
}

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        return apiClient.post<LoginResponse>('/auth/login', credentials, false);
    },

    me: async (): Promise<MeResponse> => {
        return apiClient.get<MeResponse>('/auth/me', true);
    },
};
