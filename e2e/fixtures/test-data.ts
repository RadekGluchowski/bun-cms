export const ADMIN = {
  email: 'admin@example.com',
  password: 'admin123!@#',
  name: 'Administrator',
} as const;

export const EDITOR = {
  email: 'editor@example.com',
  password: 'editor123!@#',
  name: 'Redaktor',
} as const;

export const INVALID_CREDENTIALS = {
  email: 'wrong@example.com',
  password: 'wrongpassword',
} as const;

export const SEED_PRODUCT = {
  code: 'SAMPLE',
  name: 'Sample Product',
  description: 'A sample product for testing purposes',
} as const;

export const SEED_CONFIG_TYPES = ['general', 'settings', 'metadata', 'translations'] as const;

export const API_BASE = 'http://localhost:3000';

export const TEST_PRODUCT = {
  code: 'TEST-E2E',
  name: 'Test E2E Product',
  description: 'Product created by e2e tests',
  previewUrl: 'https://preview.example.com/test',
} as const;

export const TEST_CONFIG_DOCUMENT = {
  meta: {
    title: 'Test Config',
    description: 'Test config description',
    category: 'test',
    icon: 'Settings',
    schemaVersion: 1,
  },
  body: {
    key: 'value',
    nested: { a: 1, b: 2 },
  },
} as const;
