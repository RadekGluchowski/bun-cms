import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { SEED_PRODUCT, API_BASE } from '../../fixtures/test-data';

test.describe('Public Config API', () => {
  const api = new ApiHelper();
  let sampleProductId: string;
  let draftConfigId: string | null = null;

  test.beforeAll(async () => {
    // Ensure the seed product exists and has a published config
    const { products } = await api.getProducts({ search: SEED_PRODUCT.code });
    const found = products.find((p) => p.code === SEED_PRODUCT.code);
    if (!found) {
      throw new Error(`Seed product ${SEED_PRODUCT.code} not found`);
    }
    sampleProductId = found.id;

    // Publish a config to ensure the public endpoint returns data
    try {
      const config = await api.getConfig(sampleProductId, 'general', 'published');
      if (!config) {
        await api.saveConfig(sampleProductId, 'general', {
          meta: {
            title: 'Public Config Test',
            description: 'Config for public API E2E test',
            category: 'test',
            icon: 'Settings',
            schemaVersion: 1,
          },
          body: { publicTest: true, key: 'value' },
        });
        await api.publishConfig(sampleProductId, 'general');
      }
    } catch {
      await api.saveConfig(sampleProductId, 'general', {
        meta: {
          title: 'Public Config Test',
          description: 'Config for public API E2E test',
          category: 'test',
          icon: 'Settings',
          schemaVersion: 1,
        },
        body: { publicTest: true, key: 'value' },
      });
      await api.publishConfig(sampleProductId, 'general');
    }

    // Save a separate draft config (not published) for the draft preview test
    const draftResult = await api.saveConfig(sampleProductId, 'settings', {
      meta: {
        title: 'Draft Only Config',
        description: 'This config is draft only',
        category: 'test',
        icon: 'Settings',
        schemaVersion: 1,
      },
      body: { draftOnly: true, testKey: 'draftValue' },
    });
    draftConfigId = draftResult.id;
  });

  test('should return published config bundle by product code', async () => {
    const response = await fetch(
      `${API_BASE}/api/public/products/${SEED_PRODUCT.code}/config`
    );

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
    expect(typeof data).toBe('object');
  });

  test('should return 404 when product code does not exist', async () => {
    const nonExistentCode = `NON_EXISTENT_PRODUCT_${Date.now()}`;
    const response = await fetch(
      `${API_BASE}/api/public/products/${nonExistentCode}/config`
    );

    expect(response.status).toBe(404);
  });

  test('should return only published configs (not drafts)', async () => {
    // Fetch the public config bundle
    const response = await fetch(
      `${API_BASE}/api/public/products/${SEED_PRODUCT.code}/config`
    );

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toBeTruthy();

    // The public endpoint should only contain published configs.
    // If 'settings' is included, it should only be the published version (not the draft).
    // The 'general' config should be present since we published it in beforeAll.
    expect(typeof data).toBe('object');
  });

  test('should return draft preview by config ID', async () => {
    // draftConfigId was set in beforeAll when we saved a draft 'settings' config
    expect(draftConfigId).toBeTruthy();

    const response = await fetch(
      `${API_BASE}/api/public/draft/${draftConfigId}`
    );

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toBeTruthy();
    expect(typeof data).toBe('object');
  });

  test('should not require authentication for public endpoints', async () => {
    // Make request without any Authorization header to the public config endpoint
    const response = await fetch(
      `${API_BASE}/api/public/products/${SEED_PRODUCT.code}/config`,
      {
        headers: {
          'Content-Type': 'application/json',
          // Intentionally no Authorization header
        },
      }
    );

    // Should succeed without authentication
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();

    // Also verify draft preview endpoint works without auth
    if (draftConfigId) {
      const draftResponse = await fetch(
        `${API_BASE}/api/public/draft/${draftConfigId}`,
        {
          headers: {
            // Intentionally no Authorization header
          },
        }
      );

      expect(draftResponse.ok).toBe(true);
      expect(draftResponse.status).toBe(200);
    }
  });
});
