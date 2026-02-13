import { createHash } from 'crypto';
import { and, eq } from 'drizzle-orm';

import type { ConfigDocument } from '@app/shared';
import { configs, db, products } from '../db';
import { NotFoundError } from '../middleware/error.handler';
import type {
    BundleConfigs,
    DraftPreviewBundleResponse,
    PublishedBundleResponse,
} from './public.types';

/**
 * Wyciąga body z ConfigDocument.
 * Jeśli data jest w formacie ConfigDocument (ma meta+body), zwraca body.
 * Dla legacy data (plain object), zwraca całość.
 */
function extractConfigBody(data: unknown): unknown {
    if (data && typeof data === 'object' && 'meta' in data && 'body' in data) {
        return (data as ConfigDocument).body;
    }
    // Legacy: zwróć całość
    return data;
}

function generateVersionHash(configs: BundleConfigs): string {
    const content = JSON.stringify(configs);
    const hash = createHash('sha256').update(content).digest('hex');
    return hash.substring(0, 12);
}

export const publicService = {
    async getPublishedBundle(productCode: string): Promise<PublishedBundleResponse> {
        const [product] = await db
            .select({
                id: products.id,
                code: products.code,
                name: products.name,
                isActive: products.isActive,
            })
            .from(products)
            .where(eq(products.code, productCode))
            .limit(1);

        if (!product) {
            throw new NotFoundError(`Product with code '${productCode}' not found`);
        }

        if (!product.isActive) {
            throw new NotFoundError(`Product with code '${productCode}' is not available`);
        }

        const publishedConfigs = await db
            .select({
                configType: configs.configType,
                data: configs.data,
            })
            .from(configs)
            .where(
                and(
                    eq(configs.productId, product.id),
                    eq(configs.status, 'published')
                )
            );

        const bundleConfigs: BundleConfigs = {};
        for (const config of publishedConfigs) {
            const configType = config.configType;
            // Wyciągnij body z ConfigDocument
            bundleConfigs[configType] = extractConfigBody(config.data);
        }

        const version = generateVersionHash(bundleConfigs);

        return {
            productCode: product.code,
            productName: product.name,
            configs: bundleConfigs,
            version,
        };
    },

    async getDraftBundle(productCode: string): Promise<DraftPreviewBundleResponse> {
        const [product] = await db
            .select({
                id: products.id,
                code: products.code,
                name: products.name,
                isActive: products.isActive,
            })
            .from(products)
            .where(eq(products.code, productCode))
            .limit(1);

        if (!product) {
            throw new NotFoundError(`Product with code '${productCode}' not found`);
        }

        if (!product.isActive) {
            throw new NotFoundError(`Product with code '${productCode}' is not available`);
        }

        const allConfigs = await db
            .select({
                configType: configs.configType,
                data: configs.data,
                status: configs.status,
            })
            .from(configs)
            .where(eq(configs.productId, product.id));

        const bundleConfigs: BundleConfigs = {};

        // First pass: add all published configs as fallback
        for (const config of allConfigs) {
            if (config.status === 'published') {
                bundleConfigs[config.configType] = extractConfigBody(config.data);
            }
        }

        // Second pass: override with drafts where available
        for (const config of allConfigs) {
            if (config.status === 'draft') {
                bundleConfigs[config.configType] = extractConfigBody(config.data);
            }
        }

        const version = generateVersionHash(bundleConfigs);

        return {
            productCode: product.code,
            productName: product.name,
            configs: bundleConfigs,
            version,
            isDraft: true,
        };
    },

    async getDraftPreviewBundle(configId: string): Promise<DraftPreviewBundleResponse> {
        const [draftConfig] = await db
            .select({
                id: configs.id,
                productId: configs.productId,
                configType: configs.configType,
                data: configs.data,
                status: configs.status,
            })
            .from(configs)
            .where(eq(configs.id, configId))
            .limit(1);

        if (!draftConfig) {
            throw new NotFoundError(`Config with id '${configId}' not found`);
        }

        if (draftConfig.status !== 'draft') {
            throw new NotFoundError(`Config with id '${configId}' is not a draft`);
        }

        const [product] = await db
            .select({
                id: products.id,
                code: products.code,
                name: products.name,
                isActive: products.isActive,
            })
            .from(products)
            .where(eq(products.id, draftConfig.productId))
            .limit(1);

        if (!product) {
            throw new NotFoundError('Product not found for this config');
        }

        const draftConfigType = draftConfig.configType;

        // Pobierz wszystkie published konfiguracje oprócz tej, która jest draftem
        const publishedConfigs = await db
            .select({
                configType: configs.configType,
                data: configs.data,
            })
            .from(configs)
            .where(
                and(
                    eq(configs.productId, product.id),
                    eq(configs.status, 'published')
                )
            );

        const bundleConfigs: BundleConfigs = {};

        // Dodaj published configs (oprócz tej, którą zastępujemy draftem)
        for (const config of publishedConfigs) {
            const configType = config.configType;
            if (configType !== draftConfigType) {
                bundleConfigs[configType] = extractConfigBody(config.data);
            }
        }

        // Nadpisz draftem
        bundleConfigs[draftConfigType] = extractConfigBody(draftConfig.data);

        const version = generateVersionHash(bundleConfigs);

        return {
            productCode: product.code,
            productName: product.name,
            configs: bundleConfigs,
            version,
            isDraft: true,
        };
    },
};
