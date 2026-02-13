import { relations, sql } from 'drizzle-orm';
import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const adminRoleEnum = pgEnum('admin_role', ['admin', 'editor']);

export const configStatusEnum = pgEnum('config_status', ['draft', 'published']);

export const historyActionEnum = pgEnum('history_action', [
    'create',
    'update',
    'publish',
    'rollback',
]);

export const admins = pgTable('admins', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: adminRoleEnum('role').notNull().default('editor'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable('products', {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    previewUrl: text('preview_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('products_code_active_idx').on(table.code).where(sql`${table.isActive} = true`),
]);

export const configs = pgTable('configs', {
    id: text('id').primaryKey(),
    productId: text('product_id')
        .notNull()
        .references(() => products.id),
    configType: text('config_type').notNull(),
    data: jsonb('data').notNull(),
    version: integer('version').notNull().default(1),
    status: configStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text('updated_by').references(() => admins.id),
});

export const configHistory = pgTable('config_history', {
    id: text('id').primaryKey(),
    configId: text('config_id')
        .notNull()
        .references(() => configs.id),
    productId: text('product_id')
        .notNull()
        .references(() => products.id),
    configType: text('config_type').notNull(),
    data: jsonb('data').notNull(),
    version: integer('version').notNull(),
    action: historyActionEnum('action').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    changedBy: text('changed_by').references(() => admins.id),
});

export const adminsRelations = relations(admins, ({ many }) => ({
    updatedConfigs: many(configs),
    changedConfigHistory: many(configHistory),
}));

export const productsRelations = relations(products, ({ many }) => ({
    configs: many(configs),
    configHistory: many(configHistory),
}));

export const configsRelations = relations(configs, ({ one, many }) => ({
    product: one(products, {
        fields: [configs.productId],
        references: [products.id],
    }),
    updatedByAdmin: one(admins, {
        fields: [configs.updatedBy],
        references: [admins.id],
    }),
    history: many(configHistory),
}));

export const configHistoryRelations = relations(configHistory, ({ one }) => ({
    config: one(configs, {
        fields: [configHistory.configId],
        references: [configs.id],
    }),
    product: one(products, {
        fields: [configHistory.productId],
        references: [products.id],
    }),
    changedByAdmin: one(admins, {
        fields: [configHistory.changedBy],
        references: [admins.id],
    }),
}));

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Config = typeof configs.$inferSelect;
export type NewConfig = typeof configs.$inferInsert;

export type ConfigHistoryEntry = typeof configHistory.$inferSelect;
export type NewConfigHistoryEntry = typeof configHistory.$inferInsert;

// Enum types
export type ConfigStatus = (typeof configStatusEnum.enumValues)[number];
export type HistoryAction = (typeof historyActionEnum.enumValues)[number];

// ConfigType is now dynamic (any string)
export type ConfigType = string;
