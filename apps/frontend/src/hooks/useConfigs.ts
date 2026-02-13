import {
    configsApi,
    type Config,
    type ConfigData,
    type ConfigStatus,
    type ConfigStatusesResponse,
    type ConfigType,
    type HistoryParams,
    type HistoryResponse,
} from '@/api/configs.api';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productKeys } from './useProducts';

export const configKeys = {
    all: ['configs'] as const,
    statuses: () => [...configKeys.all, 'statuses'] as const,
    statusesByProduct: (productId: string) => [...configKeys.statuses(), productId] as const,
    configs: () => [...configKeys.all, 'config'] as const,
    config: (productId: string, configType: ConfigType, status?: ConfigStatus) =>
        [...configKeys.configs(), productId, configType, status] as const,
    histories: () => [...configKeys.all, 'history'] as const,
    history: (productId: string, configType: ConfigType, page?: number) =>
        [...configKeys.histories(), productId, configType, page] as const,
    productHistory: (productId: string, configType?: ConfigType, page?: number) =>
        [...configKeys.histories(), 'product', productId, configType, page] as const,
};

export function useConfigStatuses(productId: string | undefined) {
    return useQuery<ConfigStatusesResponse>({
        queryKey: configKeys.statusesByProduct(productId!),
        queryFn: () => configsApi.getStatuses(productId!),
        enabled: Boolean(productId),
    });
}

export function useConfig(
    productId: string | undefined,
    configType: ConfigType | undefined,
    status?: ConfigStatus
) {
    return useQuery<Config>({
        queryKey: configKeys.config(productId!, configType!, status),
        queryFn: () => configsApi.get(productId!, configType!, status),
        enabled: Boolean(productId) && Boolean(configType),
        retry: (failureCount, error) => {
            // Don't retry on 404 (config doesn't exist yet)
            const status = (error as { status?: number }).status;
            if (status === 404) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

export function useConfigHistory(
    productId: string | undefined,
    configType: ConfigType | undefined,
    page: number = 1
) {
    return useQuery<HistoryResponse>({
        queryKey: configKeys.history(productId!, configType!, page),
        queryFn: () => configsApi.getHistory(productId!, configType!, { page }),
        enabled: Boolean(productId) && Boolean(configType),
    });
}

export function useProductHistory(
    productId: string | undefined,
    options: { configType?: ConfigType; page?: number; limit?: number } = {}
) {
    const { configType, page = 1, limit = 20 } = options;

    return useQuery<HistoryResponse>({
        queryKey: configKeys.productHistory(productId!, configType, page),
        queryFn: () => {
            const params: HistoryParams = { page, limit };
            if (configType) {
                params.configType = configType;
            }
            return configsApi.getAllHistory(productId!, params);
        },
        enabled: Boolean(productId),
        placeholderData: (previousData) => previousData,
    });
}

export function useProductHistoryInfinite(
    productId: string | undefined,
    configType?: ConfigType
) {
    return useInfiniteQuery<HistoryResponse>({
        queryKey: [...configKeys.productHistory(productId!, configType), 'infinite'],
        queryFn: ({ pageParam = 1 }) => {
            const params: HistoryParams = { page: pageParam as number, limit: 20 };
            if (configType) {
                params.configType = configType;
            }
            return configsApi.getAllHistory(productId!, params);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const hasMore = lastPage.page * 20 < lastPage.total;
            return hasMore ? lastPage.page + 1 : undefined;
        },
        enabled: Boolean(productId),
    });
}

export function useUpdateConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            productId,
            configType,
            data,
        }: {
            productId: string;
            configType: ConfigType;
            data: ConfigData;
        }) => configsApi.update(productId, configType, data),
        onSuccess: async (_data, variables) => {
            // Invalidate and refetch config statuses - this is critical for hasDraft/hasPublished
            await queryClient.refetchQueries({
                queryKey: configKeys.statusesByProduct(variables.productId),
                exact: true,
            });
            // Invalidate specific config
            await queryClient.invalidateQueries({
                queryKey: configKeys.configs(),
            });
            // Invalidate history
            await queryClient.invalidateQueries({
                queryKey: configKeys.histories(),
            });
            // Invalidate product detail so ProductDetailPage shows fresh configStatuses
            await queryClient.invalidateQueries({
                queryKey: productKeys.detail(variables.productId),
            });
        },
    });
}

export function usePublishConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            productId,
            configType,
        }: {
            productId: string;
            configType: ConfigType;
        }) => configsApi.publish(productId, configType),
        onSuccess: async (_data, variables) => {
            // Invalidate config statuses and wait for refetch
            await queryClient.invalidateQueries({
                queryKey: configKeys.statusesByProduct(variables.productId),
            });
            // Invalidate specific configs
            await queryClient.invalidateQueries({
                queryKey: configKeys.configs(),
            });
            // Invalidate history
            await queryClient.invalidateQueries({
                queryKey: configKeys.histories(),
            });
            // Invalidate product detail so ProductDetailPage shows fresh configStatuses
            await queryClient.invalidateQueries({
                queryKey: productKeys.detail(variables.productId),
            });
        },
    });
}

export function useRollbackConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            productId,
            configType,
            historyId,
        }: {
            productId: string;
            configType: ConfigType;
            historyId: string;
        }) => configsApi.rollback(productId, configType, historyId),
        onSuccess: async (_data, variables) => {
            // Invalidate config statuses and wait for refetch
            await queryClient.invalidateQueries({
                queryKey: configKeys.statusesByProduct(variables.productId),
            });
            // Invalidate specific configs
            await queryClient.invalidateQueries({
                queryKey: configKeys.configs(),
            });
            // Invalidate history
            await queryClient.invalidateQueries({
                queryKey: configKeys.histories(),
            });
            // Invalidate product detail so ProductDetailPage shows fresh configStatuses
            await queryClient.invalidateQueries({
                queryKey: productKeys.detail(variables.productId),
            });
        },
    });
}
