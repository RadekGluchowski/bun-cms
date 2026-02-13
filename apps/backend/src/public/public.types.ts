import { t, type Static } from 'elysia';

export const productCodeParamSchema = t.Object({
    code: t.String({
        minLength: 1,
        maxLength: 100,
        error: 'Product code is required',
    }),
});

export const configIdParamSchema = t.Object({
    configId: t.String({
        minLength: 36,
        maxLength: 36,
        error: 'Invalid config ID format',
    }),
});

// BundleConfigType teraz dynamiczny - dowolny string z bazy
export type BundleConfigType = string;

/**
 * Konfiguracje w bundlu - dynamiczny Record z body z ConfigDocument.
 * Klucz to configType, wartość to body (dowolny JSON).
 */
export type BundleConfigs = Record<string, unknown>;

export interface PublishedBundleResponse {
    productCode: string;
    productName: string;
    configs: BundleConfigs;
    version: string;
}

export interface DraftPreviewBundleResponse extends PublishedBundleResponse {
    isDraft: true;
}

export type ProductCodeParam = Static<typeof productCodeParamSchema>;
export type ConfigIdParam = Static<typeof configIdParamSchema>;
