import { Elysia } from 'elysia';

import { t } from 'elysia';
import { requireAdmin } from '../auth/admin.guard';
import { authGuard } from '../auth/auth.guard';
import { NotFoundError } from '../middleware/error.handler';
import { configsService } from './configs.service';
import type {
    ConfigEntity,
    ConfigStatusesResponse,
    ConfigStatusValue,
    ConfigType,
    HistoryQueryParams,
    HistoryResponse,
} from './configs.types';
import {
    configStatusQuerySchema,
    historyQuerySchema,
    upsertConfigBodySchema,
} from './configs.types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseHistoryParams(query: { page?: string; limit?: string }): HistoryQueryParams {
    const page = query.page ? parseInt(query.page, 10) : DEFAULT_PAGE;
    const rawLimit = query.limit ? parseInt(query.limit, 10) : DEFAULT_LIMIT;
    const limit = Math.min(rawLimit, MAX_LIMIT);

    return {
        page: Math.max(1, page),
        limit: Math.max(1, limit),
    };
}

const productIdSchema = t.Object({
    id: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid product ID format',
    }),
});

// ConfigType is now dynamic - any non-empty string up to 100 chars
const configTypeSchema = t.String({
    minLength: 1,
    maxLength: 100,
    error: 'Config type must be a non-empty string (max 100 chars)',
});

const configRouteParams = t.Object({
    id: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid product ID format',
    }),
    type: configTypeSchema,
});

const historyIdParams = t.Object({
    id: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid product ID format',
    }),
    type: configTypeSchema,
    historyId: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid history ID format',
    }),
});

export const configsModule = new Elysia({ prefix: '/api/products/:id/configs' })
    .use(authGuard)
    .get(
        '/',
        async ({ params }): Promise<ConfigStatusesResponse> => {
            const statuses = await configsService.getConfigStatuses(params.id);
            return statuses;
        },
        {
            params: productIdSchema,
            detail: {
                tags: ['Configs'],
                summary: 'Get config statuses',
                description:
                    'Returns statuses (draft/published) of all config types for a product',
            },
        }
    )
    .get(
        '/:type',
        async ({ params, query }): Promise<ConfigEntity> => {
            const config = await configsService.getConfig(
                params.id,
                params.type as ConfigType,
                query.status as ConfigStatusValue | undefined
            );

            if (!config) {
                throw new NotFoundError(
                    `Config of type '${params.type}' not found for product '${params.id}'`
                );
            }

            return config;
        },
        {
            params: configRouteParams,
            query: configStatusQuerySchema,
            detail: {
                tags: ['Configs'],
                summary: 'Get config by type',
                description:
                    'Returns config data. By default returns draft if exists, otherwise published. Use ?status=draft or ?status=published to specify.',
            },
        }
    )
    .put(
        '/:type',
        async ({ params, body, currentAdmin }): Promise<ConfigEntity> => {
            const config = await configsService.upsertConfig(
                params.id,
                params.type as ConfigType,
                body.data,
                currentAdmin.id
            );
            return config;
        },
        {
            params: configRouteParams,
            body: upsertConfigBodySchema,
            detail: {
                tags: ['Configs'],
                summary: 'Create or update draft config',
                description:
                    'Creates a new draft config or updates existing draft. Version is auto-incremented.',
            },
        }
    )
    .get(
        '/:type/history',
        async ({ params, query }): Promise<HistoryResponse> => {
            const parsedParams = parseHistoryParams(query);
            const offset = (parsedParams.page - 1) * parsedParams.limit;

            const result = await configsService.getHistory(
                params.id,
                params.type as ConfigType,
                parsedParams.limit,
                offset
            );

            return result;
        },
        {
            params: configRouteParams,
            query: historyQuerySchema,
            detail: {
                tags: ['Configs'],
                summary: 'Get config history',
                description:
                    'Returns paginated history of config changes including creates, updates, publishes and rollbacks.',
            },
        }
    )
    // --- Admin-only endpoints below ---
    .use(requireAdmin)
    .post(
        '/:type/publish',
        async ({ params, currentAdmin }): Promise<ConfigEntity> => {
            const config = await configsService.publishConfig(
                params.id,
                params.type as ConfigType,
                currentAdmin.id
            );
            return config;
        },
        {
            params: configRouteParams,
            detail: {
                tags: ['Configs'],
                summary: 'Publish draft config',
                description:
                    'Publishes the current draft config. Old published version is replaced. Returns 400 if no draft exists. Admin only.',
            },
        }
    )
    .post(
        '/:type/rollback/:historyId',
        async ({ params, currentAdmin }): Promise<ConfigEntity> => {
            const config = await configsService.rollbackToHistory(
                params.historyId,
                currentAdmin.id
            );
            return config;
        },
        {
            params: historyIdParams,
            detail: {
                tags: ['Configs'],
                summary: 'Rollback to history version',
                description:
                    'Creates a new draft with data from the specified history entry. Returns 404 if history entry not found. Admin only.',
            },
        }
    );
