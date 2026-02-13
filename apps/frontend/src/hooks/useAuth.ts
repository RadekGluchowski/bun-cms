import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
    return String(error);
}

function getUserFriendlyErrorMessage(error: unknown): string {
    const message = getErrorMessage(error).toLowerCase();

    if (message.includes('invalid credentials') || message.includes('invalid email or password') || message.includes('unauthorized')) {
        return 'Nieprawidłowy email lub hasło';
    }

    if (message.includes('network') || message.includes('fetch')) {
        return 'Błąd połączenia z serwerem. Sprawdź połączenie internetowe.';
    }

    if (message.includes('timeout')) {
        return 'Upłynął czas oczekiwania. Spróbuj ponownie.';
    }

    return 'Wystąpił błąd podczas logowania. Spróbuj ponownie.';
}

export function useAuth() {
    const navigate = useNavigate();
    const { setAuth, logout: storeLogout, isAuthenticated, admin, token } = useAuthStore();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = useCallback(
        async (email: string, password: string): Promise<boolean> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await authApi.login({ email, password });
                setAuth(response.token, response.admin);
                navigate('/products', { replace: true });
                return true;
            } catch (err) {
                const friendlyMessage = getUserFriendlyErrorMessage(err);
                setError(friendlyMessage);
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [setAuth, navigate]
    );

    const logout = useCallback(() => {
        storeLogout();
        navigate('/login', { replace: true });
    }, [storeLogout, navigate]);

    const checkAuth = useCallback(async (): Promise<boolean> => {
        if (!token) {
            return false;
        }

        setIsLoading(true);

        try {
            const response = await authApi.me();
            // Update admin info in case it changed
            setAuth(token, response.admin);
            return true;
        } catch {
            // Token is invalid, clear auth
            storeLogout();
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [token, setAuth, storeLogout]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        isLoading,
        error,
        isAuthenticated,
        admin,

        // Actions
        login,
        logout,
        checkAuth,
        clearError,
    };
}
