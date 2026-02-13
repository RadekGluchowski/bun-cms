import type {
    ConfigTypeStatus,
    ConfigType,
    DeleteProductResponse,
    ImportProductRequest,
    ProductExport,
} from '@app/shared';
import { apiClient } from './client';

export type { ConfigExport, ConfigTypeStatus, ConfigType, DeleteProductResponse, ImportProductRequest, ProductExport } from '@app/shared';

export interface Product {
    id: string;
    code: string;
    name: string;
    description: string | null;
    previewUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductListParams {
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}

export interface ProductListResponse {
    products: Product[];
    total: number;
    page: number;
    limit: number;
}

export interface ProductDetailResponse {
    product: Product;
    configStatuses: ConfigTypeStatus[];
}

export interface CreateProductRequest {
    code: string;
    name: string;
    description?: string | undefined;
    previewUrl?: string | undefined;
}

export interface UpdateProductRequest {
    name?: string | undefined;
    description?: string | null | undefined;
    previewUrl?: string | null | undefined;
}

export interface ImportProductResponse {
    success: true;
    product: Product;
    importedConfigs: ConfigType[];
}

function buildQueryString(params: ProductListParams): string {
    const searchParams = new URLSearchParams();

    if (params.search) {
        searchParams.set('search', params.search);
    }
    if (params.page !== undefined) {
        searchParams.set('page', params.page.toString());
    }
    if (params.limit !== undefined) {
        searchParams.set('limit', params.limit.toString());
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
}

export const productsApi = {
    list(params: ProductListParams = {}): Promise<ProductListResponse> {
        const query = buildQueryString(params);
        return apiClient.get<ProductListResponse>(`/products${query}`);
    },

    get(id: string): Promise<ProductDetailResponse> {
        return apiClient.get<ProductDetailResponse>(`/products/${id}`);
    },

    create(data: CreateProductRequest): Promise<Product> {
        return apiClient.post<Product>('/products', data);
    },

    update(id: string, data: UpdateProductRequest): Promise<Product> {
        return apiClient.put<Product>(`/products/${id}`, data);
    },

    remove(id: string): Promise<DeleteProductResponse> {
        return apiClient.delete<DeleteProductResponse>(`/products/${id}`);
    },

    exportProduct(id: string): Promise<ProductExport> {
        return apiClient.get<ProductExport>(`/products/${id}/export`);
    },

    importProduct(id: string, data: ImportProductRequest): Promise<ImportProductResponse> {
        return apiClient.put<ImportProductResponse>(`/products/${id}/import`, data);
    },
};
