import { and, eq } from 'drizzle-orm';

import type { ConfigDocument } from '@app/shared';
import { configHistory, configs, db, products } from '../db';
import { BadRequestError, NotFoundError } from '../middleware/error.handler';
import { getHistory, getHistoryEntry } from './configs.queries';
import type {
    ConfigEntity,
    ConfigStatusesResponse,
    ConfigStatusValue,
    ConfigType,
} from './configs.types';

export const configsService = {
    async getConfigStatuses(productId: string): Promise<ConfigStatusesResponse> {
        const [product] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(eq(products.id, productId), eq(products.isActive, true)))
            .limit(1);

        if (!product) {
            throw new NotFoundError(`Product with id '${productId}' not found`);
        }

        const configRows = await db
            .select({
                configType: configs.configType,
                status: configs.status,
                version: configs.version,
            })
            .from(configs)
            .where(eq(configs.productId, productId));

        // Build statuses dynamically from existing configs
        const result: ConfigStatusesResponse = {};

        for (const row of configRows) {
            result[row.configType] ??= {
                hasDraft: false,
                hasPublished: false,
                draftVersion: null,
                publishedVersion: null,
            };

            const info = result[row.configType]!;
            if (row.status === 'draft') {
                info.hasDraft = true;
                info.draftVersion = row.version;
            } else if (row.status === 'published') {
                info.hasPublished = true;
                info.publishedVersion = row.version;
            }
        }

        return result;
    },

    async getConfig(
        productId: string,
        configType: ConfigType,
        preferredStatus?: ConfigStatusValue
    ): Promise<ConfigEntity | null> {
        if (preferredStatus) {
            const [config] = await db
                .select()
                .from(configs)
                .where(
                    and(
                        eq(configs.productId, productId),
                        eq(configs.configType, configType),
                        eq(configs.status, preferredStatus)
                    )
                )
                .limit(1);

            return config ? (config as ConfigEntity) : null;
        }

        const configRows = await db
            .select()
            .from(configs)
            .where(
                and(
                    eq(configs.productId, productId),
                    eq(configs.configType, configType)
                )
            );

        const draft = configRows.find((c) => c.status === 'draft');
        if (draft) {
            return draft as ConfigEntity;
        }

        const published = configRows.find((c) => c.status === 'published');
        return published ? (published as ConfigEntity) : null;
    },

    async getDraftConfig(
        productId: string,
        configType: ConfigType
    ): Promise<ConfigEntity | null> {
        const [config] = await db
            .select()
            .from(configs)
            .where(
                and(
                    eq(configs.productId, productId),
                    eq(configs.configType, configType),
                    eq(configs.status, 'draft')
                )
            )
            .limit(1);

        return config ? (config as ConfigEntity) : null;
    },

    async getPublishedConfig(
        productId: string,
        configType: ConfigType
    ): Promise<ConfigEntity | null> {
        const [config] = await db
            .select()
            .from(configs)
            .where(
                and(
                    eq(configs.productId, productId),
                    eq(configs.configType, configType),
                    eq(configs.status, 'published')
                )
            )
            .limit(1);

        return config ? (config as ConfigEntity) : null;
    },

    async upsertConfig(
        productId: string,
        configType: ConfigType,
        data: ConfigDocument,
        adminId: string
    ): Promise<ConfigEntity> {
        const [product] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(eq(products.id, productId), eq(products.isActive, true)))
            .limit(1);

        if (!product) {
            throw new NotFoundError(`Product with id '${productId}' not found`);
        }

        return await db.transaction(async (tx) => {
            const [existingDraft] = await tx
                .select()
                .from(configs)
                .where(
                    and(
                        eq(configs.productId, productId),
                        eq(configs.configType, configType),
                        eq(configs.status, 'draft')
                    )
                )
                .limit(1);

            const [publishedConfig] = await tx
                .select({ version: configs.version })
                .from(configs)
                .where(
                    and(
                        eq(configs.productId, productId),
                        eq(configs.configType, configType),
                        eq(configs.status, 'published')
                    )
                )
                .limit(1);

            const now = new Date();
            let result: ConfigEntity;
            let historyAction: 'create' | 'update';

            if (existingDraft) {
                const newVersion = existingDraft.version + 1;

                const [updatedConfig] = await tx
                    .update(configs)
                    .set({
                        data,
                        version: newVersion,
                        updatedAt: now,
                        updatedBy: adminId,
                    })
                    .where(eq(configs.id, existingDraft.id))
                    .returning();

                result = updatedConfig as ConfigEntity;
                historyAction = 'update';
            } else {
                const configId = crypto.randomUUID();
                const baseVersion = publishedConfig?.version ?? 0;
                const newVersion = baseVersion + 1;

                const [createdConfig] = await tx
                    .insert(configs)
                    .values({
                        id: configId,
                        productId,
                        configType,
                        data,
                        version: newVersion,
                        status: 'draft',
                        createdAt: now,
                        updatedAt: now,
                        updatedBy: adminId,
                    })
                    .returning();

                result = createdConfig as ConfigEntity;
                historyAction = 'create';
            }

            await tx.insert(configHistory).values({
                id: crypto.randomUUID(),
                configId: result.id,
                productId,
                configType,
                data,
                version: result.version,
                action: historyAction,
                changedAt: now,
                changedBy: adminId,
            });

            return result;
        });
    },

    async publishConfig(
        productId: string,
        configType: ConfigType,
        adminId: string
    ): Promise<ConfigEntity> {
        return await db.transaction(async (tx) => {
            const [draft] = await tx
                .select()
                .from(configs)
                .where(
                    and(
                        eq(configs.productId, productId),
                        eq(configs.configType, configType),
                        eq(configs.status, 'draft')
                    )
                )
                .limit(1);

            if (!draft) {
                throw new BadRequestError(
                    `No draft config exists for type '${configType}' in product '${productId}'`
                );
            }

            const [existingPublished] = await tx
                .select()
                .from(configs)
                .where(
                    and(
                        eq(configs.productId, productId),
                        eq(configs.configType, configType),
                        eq(configs.status, 'published')
                    )
                )
                .limit(1);

            const now = new Date();
            let publishedConfig: typeof configs.$inferSelect | undefined;

            if (existingPublished) {
                const [updated] = await tx
                    .update(configs)
                    .set({
                        data: draft.data,
                        version: draft.version,
                        updatedAt: now,
                        updatedBy: adminId,
                    })
                    .where(eq(configs.id, existingPublished.id))
                    .returning();

                publishedConfig = updated;

                await tx
                    .update(configHistory)
                    .set({ configId: existingPublished.id })
                    .where(eq(configHistory.configId, draft.id));

                await tx.delete(configs).where(eq(configs.id, draft.id));
            } else {
                const [updated] = await tx
                    .update(configs)
                    .set({
                        status: 'published',
                        updatedAt: now,
                        updatedBy: adminId,
                    })
                    .where(eq(configs.id, draft.id))
                    .returning();

                publishedConfig = updated;
            }

            if (!publishedConfig) {
                throw new BadRequestError('Failed to publish config');
            }

            await tx.insert(configHistory).values({
                id: crypto.randomUUID(),
                configId: publishedConfig.id,
                productId,
                configType,
                data: publishedConfig.data,
                version: publishedConfig.version,
                action: 'publish',
                changedAt: now,
                changedBy: adminId,
            });

            return publishedConfig as ConfigEntity;
        });
    },

    getHistory,

    getHistoryEntry,

    async rollbackToHistory(historyId: string, adminId: string): Promise<ConfigEntity> {
        const historyEntry = await getHistoryEntry(historyId);

        if (!historyEntry) {
            throw new NotFoundError(`History entry with id '${historyId}' not found`);
        }

        return await db.transaction(async (tx) => {
            const [product] = await tx
                .select({ id: products.id })
                .from(products)
                .where(
                    and(eq(products.id, historyEntry.productId), eq(products.isActive, true))
                )
                .limit(1);

            if (!product) {
                throw new NotFoundError(
                    `Product with id '${historyEntry.productId}' not found`
                );
            }

            const [existingDraft] = await tx
                .select()
                .from(configs)
                .where(
                    and(
                        eq(configs.productId, historyEntry.productId),
                        eq(configs.configType, historyEntry.configType),
                        eq(configs.status, 'draft')
                    )
                )
                .limit(1);

            const [publishedConfig] = await tx
                .select({ version: configs.version })
                .from(configs)
                .where(
                    and(
                        eq(configs.productId, historyEntry.productId),
                        eq(configs.configType, historyEntry.configType),
                        eq(configs.status, 'published')
                    )
                )
                .limit(1);

            const now = new Date();
            let result: ConfigEntity;

            if (existingDraft) {
                const newVersion = existingDraft.version + 1;

                const [updatedConfig] = await tx
                    .update(configs)
                    .set({
                        data: historyEntry.data,
                        version: newVersion,
                        updatedAt: now,
                        updatedBy: adminId,
                    })
                    .where(eq(configs.id, existingDraft.id))
                    .returning();

                result = updatedConfig as ConfigEntity;
            } else {
                const configId = crypto.randomUUID();
                const baseVersion = publishedConfig?.version ?? 0;
                const newVersion = baseVersion + 1;

                const [createdConfig] = await tx
                    .insert(configs)
                    .values({
                        id: configId,
                        productId: historyEntry.productId,
                        configType: historyEntry.configType,
                        data: historyEntry.data,
                        version: newVersion,
                        status: 'draft',
                        createdAt: now,
                        updatedAt: now,
                        updatedBy: adminId,
                    })
                    .returning();

                result = createdConfig as ConfigEntity;
            }

            await tx.insert(configHistory).values({
                id: crypto.randomUUID(),
                configId: result.id,
                productId: historyEntry.productId,
                configType: historyEntry.configType,
                data: historyEntry.data,
                version: result.version,
                action: 'rollback',
                changedAt: now,
                changedBy: adminId,
            });

            return result;
        });
    },
};
