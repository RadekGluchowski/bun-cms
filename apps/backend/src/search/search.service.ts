import { and, eq, ilike, or, sql } from 'drizzle-orm';

import { configs, db, products } from '../db';
import type { SearchResponse, SearchResult } from './search.types';

export const searchService = {
    async search(query: string): Promise<SearchResponse> {
        const searchTerm = `%${query}%`;

        const [productResults, configResults] = await Promise.all([
            this.searchProducts(searchTerm),
            this.searchConfigs(searchTerm),
        ]);

        return {
            products: productResults,
            configs: configResults,
        };
    },

    async searchProducts(searchTerm: string): Promise<SearchResult[]> {
        const productRows = await db
            .select({
                id: products.id,
                code: products.code,
                name: products.name,
            })
            .from(products)
            .where(
                and(
                    eq(products.isActive, true),
                    or(
                        ilike(products.name, searchTerm),
                        ilike(products.code, searchTerm)
                    )
                )
            )
            .limit(5);

        return productRows.map((product) => ({
            id: product.id,
            type: 'product' as const,
            title: product.name,
            subtitle: product.code,
            url: `/products/${product.id}`,
        }));
    },

    async searchConfigs(searchTerm: string): Promise<SearchResult[]> {
        const configRows = await db
            .select({
                configId: configs.id,
                configType: configs.configType,
                status: configs.status,
                version: configs.version,
                productId: configs.productId,
                productName: products.name,
                productCode: products.code,
            })
            .from(configs)
            .innerJoin(products, eq(configs.productId, products.id))
            .where(
                and(
                    eq(products.isActive, true),
                    sql`${configs.data}::text ILIKE ${searchTerm}`
                )
            )
            .limit(10);

        return configRows.map((config) => ({
            id: config.configId,
            type: 'config' as const,
            title: `${config.productName} - ${formatConfigType(config.configType)}`,
            subtitle: `${config.status === 'draft' ? 'Draft' : 'Published'} v${config.version}`,
            url: `/products/${config.productId}/configs/${config.configType}`,
        }));
    },
};

function formatConfigType(configType: string): string {
    const typeLabels: Record<string, string> = {
        general: 'Ogólne',
        settings: 'Ustawienia',
        metadata: 'Metadane',
        translations: 'Tłumaczenia',
    };
    return typeLabels[configType] ?? configType;
}
