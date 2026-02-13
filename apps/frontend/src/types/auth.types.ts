import type { AdminRole } from '@app/shared';

export interface Admin {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
}

export interface LoginResponse {
    token: string;
    admin: Admin;
}

export interface MeResponse {
    admin: Admin;
}

export interface AuthState {
    token: string | null;
    admin: Admin | null;
    isAuthenticated: boolean;
}

export interface AuthActions {
    setAuth: (token: string, admin: Admin) => void;
    logout: () => void;
    getToken: () => string | null;
}

export type AuthStore = AuthState & AuthActions;
