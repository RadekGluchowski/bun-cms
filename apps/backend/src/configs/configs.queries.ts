import { and, count, desc, eq } from 'drizzle-orm';

import { admins, configHistory, db } from '../db';
import type { ConfigType, HistoryEntry, HistoryResponse } from './configs.types';

export async function getHistory(
    productId: string,
    configType: ConfigType | undefined,
    limit: number,
    offset: number
): Promise<HistoryResponse> {
    const baseCondition = eq(configHistory.productId, productId);
    const whereCondition = configType
        ? and(baseCondition, eq(configHistory.configType, configType))
        : baseCondition;

    const [historyRows, totalResult] = await Promise.all([
        db
            .select({
                id: configHistory.id,
                configId: configHistory.configId,
                productId: configHistory.productId,
                configType: configHistory.configType,
                data: configHistory.data,
                version: configHistory.version,
                action: configHistory.action,
                changedAt: configHistory.changedAt,
                changedBy: configHistory.changedBy,
                changedByName: admins.name,
            })
            .from(configHistory)
            .leftJoin(admins, eq(configHistory.changedBy, admins.id))
            .where(whereCondition)
            .orderBy(desc(configHistory.changedAt))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: count() })
            .from(configHistory)
            .where(whereCondition),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const page = Math.floor(offset / limit) + 1;

    return {
        history: historyRows as HistoryEntry[],
        total,
        page,
        limit,
    };
}

export async function getHistoryEntry(historyId: string): Promise<HistoryEntry | null> {
    const [entry] = await db
        .select({
            id: configHistory.id,
            configId: configHistory.configId,
            productId: configHistory.productId,
            configType: configHistory.configType,
            data: configHistory.data,
            version: configHistory.version,
            action: configHistory.action,
            changedAt: configHistory.changedAt,
            changedBy: configHistory.changedBy,
            changedByName: admins.name,
        })
        .from(configHistory)
        .leftJoin(admins, eq(configHistory.changedBy, admins.id))
        .where(eq(configHistory.id, historyId))
        .limit(1);

    return entry ? (entry as HistoryEntry) : null;
}
