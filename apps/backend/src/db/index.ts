import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

const queryClient = postgres(DATABASE_URL, {
    max: 10,
    onnotice: () => { },
});

export const db = drizzle(queryClient, { schema });

export const sql = queryClient;

export async function closeConnection(): Promise<void> {
    await queryClient.end();
}

export * from './schema';
