import type {
    ConfigDocument,
    ConfigStatus,
    ConfigStatusesResponse,
    ConfigType,
    HistoryAction,
} from '@app/shared';
import { apiClient } from './client';

export type { ConfigStatus, ConfigStatusesResponse, ConfigType, HistoryAction } from '@app/shared';

export type ConfigData = ConfigDocument;

export interface Config {
    id: string;
    productId: string;
    configType: ConfigType;
    status: ConfigStatus;
    version: number;
    data: ConfigData;
    createdAt: string;
    updatedAt: string;
}

export interface HistoryEntry {
    id: string;
    configId: string;
    productId: string;
    configType: ConfigType;
    version: number;
    action: HistoryAction;
    data: ConfigData;
    changedBy: string;
    changedByName: string;
    changedAt: string;
}

export interface HistoryResponse {
    history: HistoryEntry[];
    total: number;
    page: number;
    limit: number;
}

export interface UpdateConfigRequest {
    data: ConfigData;
}

export interface HistoryParams {
    page?: number;
    limit?: number;
    configType?: ConfigType;
}

function buildHistoryQueryString(params: HistoryParams): string {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
        searchParams.set('page', params.page.toString());
    }
    if (params.limit !== undefined) {
        searchParams.set('limit', params.limit.toString());
    }
    if (params.configType !== undefined) {
        searchParams.set('configType', params.configType);
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
}

export const configsApi = {
    getStatuses(productId: string): Promise<ConfigStatusesResponse> {
        return apiClient.get<ConfigStatusesResponse>(`/products/${productId}/configs`);
    },

    get(productId: string, configType: ConfigType, status?: ConfigStatus): Promise<Config> {
        const statusQuery = status ? `?status=${status}` : '';
        return apiClient.get<Config>(`/products/${productId}/configs/${configType}${statusQuery}`);
    },

    update(productId: string, configType: ConfigType, data: ConfigData): Promise<Config> {
        return apiClient.put<Config>(`/products/${productId}/configs/${configType}`, { data });
    },

    publish(productId: string, configType: ConfigType): Promise<Config> {
        return apiClient.post<Config>(`/products/${productId}/configs/${configType}/publish`);
    },

    getHistory(productId: string, configType: ConfigType, params: HistoryParams = {}): Promise<HistoryResponse> {
        const query = buildHistoryQueryString(params);
        return apiClient.get<HistoryResponse>(`/products/${productId}/configs/${configType}/history${query}`);
    },

    getAllHistory(productId: string, params: HistoryParams = {}): Promise<HistoryResponse> {
        const query = buildHistoryQueryString(params);
        return apiClient.get<HistoryResponse>(`/products/${productId}/history${query}`);
    },

    rollback(productId: string, configType: ConfigType, historyId: string): Promise<Config> {
        return apiClient.post<Config>(`/products/${productId}/configs/${configType}/rollback/${historyId}`);
    },
};
