import { ApiHelper } from './api.helper';

const api = new ApiHelper();

/**
 * Creates a product via API and returns its ID.
 * Useful for test setup.
 */
export async function createTestProduct(overrides?: {
  code?: string;
  name?: string;
  description?: string;
  previewUrl?: string;
}): Promise<{ id: string; code: string; name: string }> {
  const timestamp = Date.now();
  const product = {
    code: overrides?.code ?? `E2E-${timestamp}`,
    name: overrides?.name ?? `E2E Test Product ${timestamp}`,
    description: overrides?.description ?? 'Created by e2e test',
    previewUrl: overrides?.previewUrl,
  };
  return api.createProduct(product);
}

/**
 * Deletes a product via API.
 */
export async function deleteTestProduct(id: string): Promise<void> {
  return api.deleteProduct(id);
}

/**
 * Creates multiple products for pagination tests.
 */
export async function createManyProducts(
  count: number,
  prefix: string = 'BULK'
): Promise<Array<{ id: string; code: string; name: string }>> {
  const products = [];
  for (let i = 0; i < count; i++) {
    const product = await api.createProduct({
      code: `${prefix}-${String(i).padStart(3, '0')}`,
      name: `${prefix} Product ${String(i).padStart(3, '0')}`,
      description: `Bulk product ${i} for testing`,
    });
    products.push(product);
  }
  return products;
}

/**
 * Cleans up all products with a given code prefix.
 */
export async function cleanupProducts(prefix: string): Promise<void> {
  return api.cleanupTestProducts(prefix);
}
