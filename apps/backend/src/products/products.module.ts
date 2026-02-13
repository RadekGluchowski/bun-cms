import { Elysia } from 'elysia';

import { t } from 'elysia';
import { requireAdmin } from '../auth/admin.guard';
import { authGuard } from '../auth/auth.guard';
import { getHistory } from '../configs/configs.queries';
import type { ConfigType, HistoryResponse } from '../configs/configs.types';
import { productsService } from './products.service';
import type {
    DeleteProductResponse,
    ImportProductResponse,
    ProductDetailResponse,
    ProductEntity,
    ProductExport,
    ProductListParams,
    ProductListResponse,
} from './products.types';
import {
    createProductBodySchema,
    productIdParamsSchema,
    productListQuerySchema,
    updateProductBodySchema,
} from './products.types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseListParams(query: { search?: string; page?: string; limit?: string }): ProductListParams {
    const page = query.page ? parseInt(query.page, 10) : DEFAULT_PAGE;
    const rawLimit = query.limit ? parseInt(query.limit, 10) : DEFAULT_LIMIT;
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const searchTerm = query.search?.trim();
    return {
        search: searchTerm === '' ? undefined : searchTerm,
        page: Math.max(1, page),
        limit: Math.max(1, limit),
    };
}

export const productsModule = new Elysia({ prefix: '/api/products' })
    .use(authGuard)
    .get(
        '/',
        async ({ query }): Promise<ProductListResponse> => {
            const params = parseListParams(query);
            return productsService.listProducts(params);
        },
        {
            query: productListQuerySchema,
            detail: {
                tags: ['Products'],
                summary: 'List products',
                description: 'Returns paginated list of active products with optional search',
            },
        }
    )
    .get(
        '/:id',
        async ({ params }): Promise<ProductDetailResponse> => {
            return productsService.getProduct(params.id);
        },
        {
            params: productIdParamsSchema,
            detail: {
                tags: ['Products'],
                summary: 'Get product details',
                description: 'Returns product information with config statuses (draft/published)',
            },
        }
    )
    .post(
        '/',
        async ({ body, set }): Promise<ProductEntity> => {
            set.status = 201;
            return productsService.createProduct(body);
        },
        {
            body: createProductBodySchema,
            detail: {
                tags: ['Products'],
                summary: 'Create product',
                description: 'Creates a new product with unique code',
            },
        }
    )
    .put(
        '/:id',
        async ({ params, body }): Promise<ProductEntity> => {
            return productsService.updateProduct(params.id, body);
        },
        {
            params: productIdParamsSchema,
            body: updateProductBodySchema,
            detail: {
                tags: ['Products'],
                summary: 'Update product',
                description: 'Updates product name, description or preview URL',
            },
        }
    )
    .get(
        '/:id/history',
        async ({ params, query }): Promise<HistoryResponse> => {
            const page = query.page ? parseInt(query.page, 10) : DEFAULT_PAGE;
            const rawLimit = query.limit ? parseInt(query.limit, 10) : DEFAULT_LIMIT;
            const limit = Math.min(rawLimit, MAX_LIMIT);
            const offset = (Math.max(1, page) - 1) * limit;
            const configType = query.configType as ConfigType | undefined;

            return getHistory(params.id, configType, limit, offset);
        },
        {
            params: productIdParamsSchema,
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                configType: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
            }),
            detail: {
                tags: ['Products'],
                summary: 'Get product history',
                description: 'Returns paginated history of all config changes for a product. Optionally filter by configType.',
            },
        }
    )
    .get(
        '/:id/export',
        async ({ params }): Promise<ProductExport> => {
            return productsService.exportProduct(params.id);
        },
        {
            params: productIdParamsSchema,
            detail: {
                tags: ['Products'],
                summary: 'Export product',
                description: 'Exports product with all its configurations as JSON',
            },
        }
    )
    // --- Admin-only endpoints below ---
    .use(requireAdmin)
    .delete(
        '/:id',
        async ({ params }): Promise<DeleteProductResponse> => {
            return productsService.deleteProduct(params.id);
        },
        {
            params: productIdParamsSchema,
            detail: {
                tags: ['Products'],
                summary: 'Delete product',
                description: 'Soft deletes a product (sets isActive to false). Admin only.',
            },
        }
    )
    .put(
        '/:id/import',
        async ({ params, body, currentAdmin }): Promise<ImportProductResponse> => {
            return productsService.importProduct(params.id, body, currentAdmin.id);
        },
        {
            params: productIdParamsSchema,
            body: t.Object({
                product: t.Object({
                    code: t.Optional(t.String()),
                    name: t.Optional(t.String()),
                    description: t.Optional(t.Union([t.String(), t.Null()])),
                    previewUrl: t.Optional(t.Union([t.String(), t.Null()])),
                }),
                configs: t.Array(t.Object({
                    configType: t.Union([
                        t.Literal('general'),
                        t.Literal('settings'),
                        t.Literal('metadata'),
                        t.Literal('translations'),
                    ]),
                    data: t.Unknown(),
                })),
            }),
            detail: {
                tags: ['Products'],
                summary: 'Import product configs',
                description: 'Imports/updates product and its configurations from JSON. Updates existing draft configs or creates new ones. Admin only.',
            },
        }
    );
