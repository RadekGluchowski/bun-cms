import { ApiHelper } from './api.helper';
import { TEST_CONFIG_DOCUMENT } from '../fixtures/test-data';

const api = new ApiHelper();

/**
 * Saves a config draft via API.
 */
export async function saveConfigDraft(
  productId: string,
  configType: string,
  data?: object
): Promise<{ id: string; version: number }> {
  return api.saveConfig(productId, configType, data ?? TEST_CONFIG_DOCUMENT);
}

/**
 * Publishes a config via API.
 */
export async function publishConfig(
  productId: string,
  configType: string
): Promise<{ id: string; version: number }> {
  return api.publishConfig(productId, configType);
}

/**
 * Creates a draft and publishes it.
 */
export async function createAndPublishConfig(
  productId: string,
  configType: string,
  data?: object
): Promise<{ id: string; version: number }> {
  await saveConfigDraft(productId, configType, data);
  return publishConfig(productId, configType);
}

/**
 * Gets the config for a product.
 */
export async function getConfig(
  productId: string,
  configType: string,
  status?: string
) {
  return api.getConfig(productId, configType, status);
}

/**
 * Creates multiple config updates to generate history entries.
 */
export async function createHistoryEntries(
  productId: string,
  configType: string,
  count: number
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await api.saveConfig(productId, configType, {
      meta: {
        title: `History Entry ${i}`,
        description: `Version ${i + 1}`,
        category: 'test',
        icon: 'Settings',
        schemaVersion: 1,
      },
      body: { iteration: i, data: `Update ${i}` },
    });
  }
}

/**
 * Gets config history for a specific config type.
 */
export async function getConfigHistory(
  productId: string,
  configType: string,
  params?: { page?: number; limit?: number }
): Promise<{ history: Array<{ id: string; version: number; action: string; createdAt: string }>; total: number }> {
  return api.getConfigHistory(productId, configType, params);
}

/**
 * Rollback a config to a specific history entry.
 */
export async function rollbackConfig(
  productId: string,
  configType: string,
  historyId: string
): Promise<{ id: string; version: number }> {
  return api.rollback(productId, configType, historyId);
}
