import {
    CONFIG_STATUSES,
    type ConfigDocument,
    type ConfigStatus,
    type ConfigStatusInfo,
    type ConfigStatusesResponse,
    type ConfigType,
} from '@app/shared';
import { t, type Static } from 'elysia';

export type ConfigStatusValue = ConfigStatus;
export { CONFIG_STATUSES };
export type { ConfigStatusInfo, ConfigStatusesResponse, ConfigType };

// ConfigType is now dynamic - any non-empty string is valid
export const configTypeParamSchema = t.Object({
    type: t.String({
        minLength: 1,
        maxLength: 100,
        error: 'Config type must be a non-empty string (max 100 chars)',
    }),
});

export const productIdParamSchema = t.Object({
    productId: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid product ID format',
    }),
});

export const configRouteParamsSchema = t.Object({
    productId: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid product ID format',
    }),
    type: t.String({
        minLength: 1,
        maxLength: 100,
        error: 'Config type must be a non-empty string (max 100 chars)',
    }),
});

export const historyIdParamSchema = t.Object({
    productId: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid product ID format',
    }),
    type: t.String({
        minLength: 1,
        maxLength: 100,
        error: 'Config type must be a non-empty string (max 100 chars)',
    }),
    historyId: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid history ID format',
    }),
});

export const configStatusQuerySchema = t.Object({
    status: t.Optional(t.Union([
        t.Literal('draft'),
        t.Literal('published'),
    ])),
});

export const historyQuerySchema = t.Object({
    page: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
    limit: t.Optional(t.String({ pattern: '^[1-9][0-9]*$' })),
});

export const upsertConfigBodySchema = t.Object({
    data: t.Object({
        meta: t.Object({
            title: t.String({ minLength: 1, maxLength: 120 }),
            description: t.Optional(t.String({ maxLength: 500 })),
            category: t.Optional(t.String({ maxLength: 80 })),
            icon: t.Optional(t.String({ maxLength: 80 })),
            schemaVersion: t.Optional(t.Number()),
        }),
        // Note: we keep body permissive; it's arbitrary JSON.
        body: t.Unknown(),
    }),
});

export interface ConfigEntity {
    id: string;
    productId: string;
    configType: ConfigType;
    data: ConfigDocument;
    version: number;
    status: ConfigStatusValue;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string | null;
}

export interface HistoryEntry {
    id: string;
    configId: string;
    productId: string;
    configType: ConfigType;
    data: ConfigDocument;
    version: number;
    action: 'create' | 'update' | 'publish' | 'rollback';
    changedAt: Date;
    changedBy: string | null;
    changedByName: string | null;
}

export interface HistoryResponse {
    history: HistoryEntry[];
    total: number;
    page: number;
    limit: number;
}

export type UpsertConfigRequest = Static<typeof upsertConfigBodySchema>;

export interface HistoryQueryParams {
    page: number;
    limit: number;
}

// ConfigType is now dynamic - any non-empty string is valid
export function isValidConfigType(value: string): value is ConfigType {
    return typeof value === 'string' && value.length > 0 && value.length <= 100;
}

export function isValidConfigStatus(value: string): value is ConfigStatusValue {
    return CONFIG_STATUSES.includes(value as ConfigStatusValue);
}
