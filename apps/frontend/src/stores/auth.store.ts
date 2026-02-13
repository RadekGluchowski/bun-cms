import type { Admin, AuthStore } from '@/types/auth.types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const AUTH_STORAGE_KEY = 'cms-auth';

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            token: null,
            admin: null,
            isAuthenticated: false,

            setAuth: (token: string, admin: Admin) => {
                set({
                    token,
                    admin,
                    isAuthenticated: true,
                });
            },

            logout: () => {
                set({
                    token: null,
                    admin: null,
                    isAuthenticated: false,
                });
            },

            getToken: () => {
                return get().token;
            },
        }),
        {
            name: AUTH_STORAGE_KEY,
            partialize: (state) => ({
                token: state.token,
                admin: state.admin,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export function getAuthToken(): string | null {
    return useAuthStore.getState().token;
}

export function performLogout(): void {
    useAuthStore.getState().logout();
}
