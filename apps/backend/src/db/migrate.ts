import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

// Type narrowing - DATABASE_URL is guaranteed to be string after the check above
const databaseUrl: string = DATABASE_URL;

/**
 * Migration script
 * Runs all pending migrations from the ./drizzle folder
 */
async function runMigrations(): Promise<void> {
    console.log('🔄 Starting database migrations...');

    // Create a dedicated connection for migrations
    const migrationClient = postgres(databaseUrl, { max: 1 });
    const db = drizzle(migrationClient);

    try {
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        // Always close the connection
        await migrationClient.end();
        console.log('🔌 Database connection closed');
    }
}

runMigrations();
