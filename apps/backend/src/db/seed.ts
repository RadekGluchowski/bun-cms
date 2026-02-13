import 'dotenv/config';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { admins, configHistory, configs, products } from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

// Type narrowing - DATABASE_URL is guaranteed to be string after the check above
const databaseUrl: string = DATABASE_URL;

// Default admin credentials
const DEFAULT_ADMIN = {
    email: 'admin@example.com',
    password: 'admin123!@#',
    name: 'Administrator',
    role: 'admin' as const,
};

const DEFAULT_EDITOR = {
    email: 'editor@example.com',
    password: 'editor123!@#',
    name: 'Redaktor',
    role: 'editor' as const,
};

const DEMO_PRODUCT = {
    code: 'SAMPLE',
    name: 'Sample Product',
    description: 'A sample product for testing purposes',
};

const DEMO_CONFIGS = {
    general: {
        meta: {
            title: 'Ogólne ustawienia',
            description: 'Podstawowe ustawienia produktu',
            category: 'Podstawowe',
            icon: 'Settings',
            schemaVersion: 1,
        },
        body: {
            title: 'Sample Product',
            version: '1.0.0',
            author: 'CMS Team',
            license: 'MIT',
            repository: 'https://github.com/example/sample-product',
        },
    },
    settings: {
        meta: {
            title: 'Ustawienia zaawansowane',
            description: 'Konfiguracja motywu, języka i funkcji',
            category: 'Konfiguracja',
            icon: 'Cog',
            schemaVersion: 1,
        },
        body: {
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
            notifications: {
                email: true,
                push: false,
                sms: false,
            },
            features: {
                darkMode: true,
                analytics: true,
                export: true,
            },
        },
    },
    metadata: {
        meta: {
            title: 'SEO & Metadata',
            description: 'Ustawienia SEO i OpenGraph',
            category: 'Marketing',
            icon: 'Search',
            schemaVersion: 1,
        },
        body: {
            seo: {
                title: 'Sample Product - Demo',
                description: 'A sample product for testing the CMS functionality',
                keywords: ['cms', 'sample', 'demo', 'product'],
            },
            openGraph: {
                type: 'website',
                image: '/og-image.png',
            },
        },
    },
    translations: {
        meta: {
            title: 'Tłumaczenia',
            description: 'Wielojęzyczne etykiety i teksty',
            category: 'Lokalizacja',
            icon: 'Languages',
            schemaVersion: 1,
        },
        body: {
            en: {
                welcome: 'Welcome',
                greeting: 'Hello, {{name}}!',
                buttons: {
                    submit: 'Submit',
                    cancel: 'Cancel',
                    save: 'Save',
                },
            },
            pl: {
                welcome: 'Witaj',
                greeting: 'Cześć, {{name}}!',
                buttons: {
                    submit: 'Wyślij',
                    cancel: 'Anuluj',
                    save: 'Zapisz',
                },
            },
        },
    },
};

async function seed(): Promise<void> {
    console.log('🌱 Starting database seed...');

    const client = postgres(databaseUrl, { max: 1 });
    const db = drizzle(client);

    try {
        // Hash password using Bun.password with argon2id algorithm
        console.log('🔐 Hashing admin password...');
        const passwordHash = await Bun.password.hash(DEFAULT_ADMIN.password, {
            algorithm: 'argon2id',
            memoryCost: 65536, // 64MB
            timeCost: 3,
        });

        // Create or get existing admin
        console.log(`👤 Creating admin: ${DEFAULT_ADMIN.email}`);

        // Check if admin exists
        const [existingAdmin] = await db
            .select({ id: admins.id })
            .from(admins)
            .where(eq(admins.email, DEFAULT_ADMIN.email.toLowerCase()))
            .limit(1);

        let adminId: string;
        if (existingAdmin) {
            adminId = existingAdmin.id;
            await db
                .update(admins)
                .set({ role: DEFAULT_ADMIN.role })
                .where(eq(admins.id, adminId));
            console.log('   → Admin already exists, ensured role=admin');
        } else {
            adminId = crypto.randomUUID();
            await db.insert(admins).values({
                id: adminId,
                email: DEFAULT_ADMIN.email.toLowerCase(),
                passwordHash,
                name: DEFAULT_ADMIN.name,
                role: DEFAULT_ADMIN.role,
            });
            console.log('   → Admin created');
        }

        // Create or get existing editor
        console.log(`👤 Creating editor: ${DEFAULT_EDITOR.email}`);
        const editorPasswordHash = await Bun.password.hash(DEFAULT_EDITOR.password, {
            algorithm: 'argon2id',
            memoryCost: 65536,
            timeCost: 3,
        });

        const [existingEditor] = await db
            .select({ id: admins.id })
            .from(admins)
            .where(eq(admins.email, DEFAULT_EDITOR.email.toLowerCase()))
            .limit(1);

        if (existingEditor) {
            await db
                .update(admins)
                .set({ role: DEFAULT_EDITOR.role })
                .where(eq(admins.id, existingEditor.id));
            console.log('   → Editor already exists, ensured role=editor');
        } else {
            await db.insert(admins).values({
                id: crypto.randomUUID(),
                email: DEFAULT_EDITOR.email.toLowerCase(),
                passwordHash: editorPasswordHash,
                name: DEFAULT_EDITOR.name,
                role: DEFAULT_EDITOR.role,
            });
            console.log('   → Editor created');
        }

        // Create or get existing product
        console.log(`📦 Creating product: ${DEMO_PRODUCT.code}`);

        const [existingProduct] = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.code, DEMO_PRODUCT.code))
            .limit(1);

        let productId: string;
        if (existingProduct) {
            productId = existingProduct.id;
            console.log('   → Product already exists, using existing ID');
        } else {
            productId = crypto.randomUUID();
            await db.insert(products).values({
                id: productId,
                code: DEMO_PRODUCT.code,
                name: DEMO_PRODUCT.name,
                description: DEMO_PRODUCT.description,
            });
            console.log('   → Product created');
        }

        // Create demo configs for the product
        console.log('📝 Creating demo configs...');
        const configTypes = ['general', 'settings', 'metadata', 'translations'] as const;

        for (const configType of configTypes) {
            // Check if config already exists for this configType
            const [existingConfig] = await db
                .select({ id: configs.id })
                .from(configs)
                .where(and(
                    eq(configs.productId, productId),
                    eq(configs.configType, configType)
                ))
                .limit(1);

            if (existingConfig) {
                console.log(`   ✓ ${configType} config already exists, skipping`);
                continue;
            }

            const configId = crypto.randomUUID();
            const configData = DEMO_CONFIGS[configType];

            await db.insert(configs).values({
                id: configId,
                productId,
                configType,
                data: configData,
                version: 1,
                status: 'draft',
                updatedBy: adminId,
            });

            // Create initial history entry
            await db.insert(configHistory).values({
                id: crypto.randomUUID(),
                configId,
                productId,
                configType,
                data: configData,
                version: 1,
                action: 'create',
                changedBy: adminId,
            });

            console.log(`   ✓ ${configType} config created`);
        }

        console.log('✅ Seed completed successfully');
        console.log('');
        console.log('📋 Created records:');
        console.log(`   Admin:  ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password} (role: ${DEFAULT_ADMIN.role})`);
        console.log(`   Editor: ${DEFAULT_EDITOR.email} / ${DEFAULT_EDITOR.password} (role: ${DEFAULT_EDITOR.role})`);
        console.log(`   Product: ${DEMO_PRODUCT.code}`);
        console.log(`   Configs: ${configTypes.join(', ')}`);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

seed();
