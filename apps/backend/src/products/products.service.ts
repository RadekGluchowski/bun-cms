import { and, count, desc, eq, ilike, or } from 'drizzle-orm';

import type { ConfigDocument, ConfigExport, ConfigMeta, ConfigType, ConfigTypeStatus, ImportProductRequest, ProductExport } from '@app/shared';
import { configHistory, configs, db, products } from '../db';
import { ConflictError, NotFoundError } from '../middleware/error.handler';
import type {
    CreateProductRequest,
    ImportProductResponse,
    ProductDetailResponse,
    ProductEntity,
    ProductListParams,
    ProductListResponse,
    UpdateProductRequest,
} from './products.types';

export const productsService = {
    async listProducts(params: ProductListParams): Promise<ProductListResponse> {
        const { search, page, limit } = params;
        const offset = (page - 1) * limit;

        const baseCondition = eq(products.isActive, true);

        const searchCondition = search
            ? or(
                ilike(products.name, `%${search}%`),
                ilike(products.code, `%${search}%`)
            )
            : undefined;

        const whereCondition = searchCondition
            ? and(baseCondition, searchCondition)
            : baseCondition;

        const [productRows, totalResult] = await Promise.all([
            db
                .select()
                .from(products)
                .where(whereCondition)
                .orderBy(desc(products.updatedAt))
                .limit(limit)
                .offset(offset),
            db
                .select({ count: count() })
                .from(products)
                .where(whereCondition),
        ]);

        const total = totalResult[0]?.count ?? 0;

        return {
            products: productRows as ProductEntity[],
            total,
            page,
            limit,
        };
    },

    async getProduct(productId: string): Promise<ProductDetailResponse> {
        const [product] = await db
            .select()
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.isActive, true)
            ))
            .limit(1);

        if (!product) {
            throw new NotFoundError(`Product with id '${productId}' not found`);
        }

        // Pobierz wszystkie konfiguracje dla produktu (dynamicznie - bez hardcoded typów)
        const configRows = await db
            .select({
                configType: configs.configType,
                status: configs.status,
                version: configs.version,
                data: configs.data,
            })
            .from(configs)
            .where(eq(configs.productId, productId));

        // Buduj dynamiczną mapę statusów konfiguracji z meta info
        const configStatusMap = new Map<string, ConfigTypeStatus>();

        for (const configRow of configRows) {
            const configType = configRow.configType;

            if (!configStatusMap.has(configType)) {
                configStatusMap.set(configType, {
                    configType,
                    hasDraft: false,
                    hasPublished: false,
                    draftVersion: null,
                    publishedVersion: null,
                    meta: null,
                });
            }

            const status = configStatusMap.get(configType)!;
            const configData = configRow.data as ConfigDocument | null;
            const meta: ConfigMeta | null = configData?.meta ?? null;

            if (configRow.status === 'draft') {
                status.hasDraft = true;
                status.draftVersion = configRow.version;
                // Priorytet: meta z draftu (najnowsze zmiany)
                if (meta) {
                    status.meta = meta;
                }
            } else if (configRow.status === 'published') {
                status.hasPublished = true;
                status.publishedVersion = configRow.version;
                // Meta z published tylko jeśli nie ma draftu
                if (!status.meta && meta) {
                    status.meta = meta;
                }
            }
        }

        const configStatuses = Array.from(configStatusMap.values());

        return {
            product: product as ProductEntity,
            configStatuses,
        };
    },

    async createProduct(data: CreateProductRequest): Promise<ProductEntity> {
        const normalizedCode = data.code.toUpperCase().trim();

        const [existingProduct] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(
                eq(products.code, normalizedCode),
                eq(products.isActive, true)
            ))
            .limit(1);

        if (existingProduct) {
            throw new ConflictError(`Product with code '${normalizedCode}' already exists`);
        }

        const productId = crypto.randomUUID();
        const now = new Date();

        const [createdProduct] = await db
            .insert(products)
            .values({
                id: productId,
                code: normalizedCode,
                name: data.name.trim(),
                description: data.description?.trim() ?? null,
                previewUrl: data.previewUrl ?? null,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return createdProduct as ProductEntity;
    },

    async updateProduct(productId: string, data: UpdateProductRequest): Promise<ProductEntity> {
        const [existingProduct] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.isActive, true)
            ))
            .limit(1);

        if (!existingProduct) {
            throw new NotFoundError(`Product with id '${productId}' not found`);
        }

        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if (data.name !== undefined) {
            updateData.name = data.name.trim();
        }

        if (data.description !== undefined) {
            updateData.description = data.description?.trim() ?? null;
        }

        if (data.previewUrl !== undefined) {
            updateData.previewUrl = data.previewUrl ?? null;
        }

        const [updatedProduct] = await db
            .update(products)
            .set(updateData)
            .where(eq(products.id, productId))
            .returning();

        return updatedProduct as ProductEntity;
    },

    async deleteProduct(productId: string): Promise<{ success: true }> {
        const [existingProduct] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.isActive, true)
            ))
            .limit(1);

        if (!existingProduct) {
            throw new NotFoundError(`Product with id '${productId}' not found`);
        }

        // Delete configHistory first (references configs.id), then configs
        await db.delete(configHistory).where(eq(configHistory.productId, productId));
        await db.delete(configs).where(eq(configs.productId, productId));

        await db
            .update(products)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId));

        return { success: true };
    },

    async exportProduct(productId: string): Promise<ProductExport> {
        const [product] = await db
            .select()
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.isActive, true)
            ))
            .limit(1);

        if (!product) {
            throw new NotFoundError(`Product with id '${productId}' not found`);
        }

        const configRows = await db
            .select({
                configType: configs.configType,
                data: configs.data,
                version: configs.version,
                status: configs.status,
            })
            .from(configs)
            .where(eq(configs.productId, productId));

        const configExports: ConfigExport[] = configRows.map(row => ({
            configType: row.configType as ConfigExport['configType'],
            data: row.data,
            version: row.version,
            status: row.status as 'draft' | 'published',
        }));

        return {
            product: {
                code: product.code,
                name: product.name,
                description: product.description,
                previewUrl: product.previewUrl,
            },
            configs: configExports,
            exportedAt: new Date().toISOString(),
            version: '1.0',
        };
    },

    async importProduct(
        productId: string,
        data: ImportProductRequest,
        adminId: string
    ): Promise<ImportProductResponse> {
        const [product] = await db
            .select()
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.isActive, true)
            ))
            .limit(1);

        if (!product) {
            throw new NotFoundError(`Product with id '${productId}' not found`);
        }

        const now = new Date();

        if (data.product.name || data.product.description !== undefined || data.product.previewUrl !== undefined) {
            const updateData: Record<string, unknown> = { updatedAt: now };
            if (data.product.name) updateData.name = data.product.name.trim();
            if (data.product.description !== undefined) updateData.description = data.product.description;
            if (data.product.previewUrl !== undefined) updateData.previewUrl = data.product.previewUrl;

            await db.update(products).set(updateData).where(eq(products.id, productId));
        }

        // ConfigType jest teraz dynamiczny - nie hardcoded
        const importedConfigs: ConfigType[] = [];

        for (const configData of data.configs) {
            const configType = configData.configType;

            const [existingConfig] = await db
                .select({ id: configs.id, version: configs.version })
                .from(configs)
                .where(and(
                    eq(configs.productId, productId),
                    eq(configs.configType, configType),
                    eq(configs.status, 'draft')
                ))
                .limit(1);

            if (existingConfig) {
                const newVersion = existingConfig.version + 1;
                await db
                    .update(configs)
                    .set({
                        data: configData.data,
                        version: newVersion,
                        updatedAt: now,
                        updatedBy: adminId,
                    })
                    .where(eq(configs.id, existingConfig.id));

                await db.insert(configHistory).values({
                    id: crypto.randomUUID(),
                    configId: existingConfig.id,
                    productId,
                    configType,
                    data: configData.data,
                    version: newVersion,
                    action: 'update',
                    changedAt: now,
                    changedBy: adminId,
                });
            } else {
                const configId = crypto.randomUUID();
                await db.insert(configs).values({
                    id: configId,
                    productId,
                    configType,
                    data: configData.data,
                    version: 1,
                    status: 'draft',
                    createdAt: now,
                    updatedAt: now,
                    updatedBy: adminId,
                });

                await db.insert(configHistory).values({
                    id: crypto.randomUUID(),
                    configId,
                    productId,
                    configType,
                    data: configData.data,
                    version: 1,
                    action: 'create',
                    changedAt: now,
                    changedBy: adminId,
                });
            }

            importedConfigs.push(configType);
        }

        const [updatedProduct] = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        return {
            success: true,
            product: updatedProduct as ProductEntity,
            importedConfigs,
        };
    },
};
