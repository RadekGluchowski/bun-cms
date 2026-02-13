import { getAuthToken, performLogout } from '@/stores/auth.store';

const API_BASE = '/api';

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly data?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
        const isLoginRequest = response.url.includes('/auth/login');
        if (!isLoginRequest) {
            performLogout();
        }
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
            errorData?.message ?? 'Unauthorized',
            401,
            errorData
        );
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
            errorData?.message ?? `Request failed with status ${response.status}`,
            response.status,
            errorData
        );
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

function createHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = createHeaders(includeAuth);

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    return handleResponse<T>(response);
}

export const apiClient = {
    get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
        return request<T>(endpoint, { method: 'GET' }, includeAuth);
    },

    post<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
        return request<T>(
            endpoint,
            {
                method: 'POST',
                body: data !== undefined ? JSON.stringify(data) : null,
            },
            includeAuth
        );
    },

    put<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
        return request<T>(
            endpoint,
            {
                method: 'PUT',
                body: data !== undefined ? JSON.stringify(data) : null,
            },
            includeAuth
        );
    },

    patch<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
        return request<T>(
            endpoint,
            {
                method: 'PATCH',
                body: data !== undefined ? JSON.stringify(data) : null,
            },
            includeAuth
        );
    },

    delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
        return request<T>(endpoint, { method: 'DELETE' }, includeAuth);
    },
};
