import type {
    ConfigType,
    ConfigTypeStatus,
} from '@app/shared';
import { t, type Static } from 'elysia';

export type { ConfigExport, ConfigTypeStatus, DeleteProductResponse, ImportProductRequest, ProductExport } from '@app/shared';

export const createProductBodySchema = t.Object({
    code: t.String({
        minLength: 1,
        maxLength: 50,
        error: 'Code is required and must be max 50 characters',
    }),
    name: t.String({
        minLength: 1,
        maxLength: 255,
        error: 'Name is required and must be max 255 characters',
    }),
    description: t.Optional(t.String({
        maxLength: 1000,
        error: 'Description must be max 1000 characters',
    })),
    previewUrl: t.Optional(t.String({
        format: 'uri',
        error: 'Preview URL must be a valid URL',
    })),
});

export const updateProductBodySchema = t.Object({
    name: t.Optional(t.String({
        minLength: 1,
        maxLength: 255,
        error: 'Name must be max 255 characters',
    })),
    description: t.Optional(t.String({
        maxLength: 1000,
        error: 'Description must be max 1000 characters',
    })),
    previewUrl: t.Optional(t.Union([
        t.String({ format: 'uri' }),
        t.Null(),
    ])),
});

export const productListQuerySchema = t.Object({
    search: t.Optional(t.String()),
    page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
    limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
});

export const productIdParamsSchema = t.Object({
    id: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid product ID format',
    }),
});

export type CreateProductRequest = Static<typeof createProductBodySchema>;

export type UpdateProductRequest = Static<typeof updateProductBodySchema>;

export interface ProductListParams {
    search: string | undefined;
    page: number;
    limit: number;
}

export interface ProductEntity {
    id: string;
    code: string;
    name: string;
    description: string | null;
    previewUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductListResponse {
    products: ProductEntity[];
    total: number;
    page: number;
    limit: number;
}

export interface ProductDetailResponse {
    product: ProductEntity;
    configStatuses: ConfigTypeStatus[];
}

export interface ImportProductResponse {
    success: true;
    product: ProductEntity;
    importedConfigs: ConfigType[];
}
