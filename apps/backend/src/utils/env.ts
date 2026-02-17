import 'dotenv/config';

const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT',
    'FRONTEND_URL',
    'LOG_LEVEL',
    'NODE_ENV',
] as const;

function validateEnvVars(): void {
    const missingVars: string[] = [];

    for (const envVar of REQUIRED_ENV_VARS) {
        if (!process.env[envVar]) {
            missingVars.push(envVar);
        }
    }

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join('\n')}\n\nPlease check your .env file.`
        );
    }
}

validateEnvVars();

const VALID_NODE_ENVS = ['development', 'production', 'test'] as const;
const nodeEnv = process.env.NODE_ENV as string;
if (!VALID_NODE_ENVS.includes(nodeEnv as (typeof VALID_NODE_ENVS)[number])) {
    throw new Error(
        `Invalid NODE_ENV: '${nodeEnv}'. Must be one of: ${VALID_NODE_ENVS.join(', ')}`
    );
}

const jwtSecret = process.env.JWT_SECRET as string;
if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters for secure token signing');
}

export const env = {
    DATABASE_URL: process.env.DATABASE_URL as string,
    JWT_SECRET: jwtSecret,
    PORT: parseInt(process.env.PORT as string, 10),
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    LOG_LEVEL: process.env.LOG_LEVEL as string,
    NODE_ENV: nodeEnv as 'development' | 'production' | 'test',
} as const;

export function isDevelopment(): boolean {
    return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
    return env.NODE_ENV === 'production';
}

export function isTest(): boolean {
    return env.NODE_ENV === 'test';
}
