import {
    type CreateProductRequest,
    type ProductDetailResponse,
    type ProductListParams,
    type ProductListResponse,
    productsApi,
    type UpdateProductRequest,
} from '@/api/products.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: string) => [...productKeys.details(), id] as const,
};

export function useProductsList(params: ProductListParams = {}) {
    return useQuery<ProductListResponse>({
        queryKey: productKeys.list(params),
        queryFn: () => productsApi.list(params),
        placeholderData: (previousData) => previousData,
    });
}

export function useProduct(id: string | undefined) {
    return useQuery<ProductDetailResponse>({
        queryKey: productKeys.detail(id!),
        queryFn: () => productsApi.get(id!),
        enabled: Boolean(id),
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProductRequest) => productsApi.create(data),
        onSuccess: () => {
            // Invalidate all product lists to refresh data
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
            productsApi.update(id, data),
        onSuccess: (_data, variables) => {
            // Invalidate all lists
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            // Invalidate specific product detail
            queryClient.invalidateQueries({
                queryKey: productKeys.detail(variables.id),
            });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => productsApi.remove(id),
        onSuccess: (_data, id) => {
            // Invalidate all lists
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            // Remove specific product from cache
            queryClient.removeQueries({ queryKey: productKeys.detail(id) });
        },
    });
}
