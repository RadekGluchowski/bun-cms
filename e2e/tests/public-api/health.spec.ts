import { test, expect } from '@playwright/test';
import { API_BASE } from '../../fixtures/test-data';

test.describe('Health Check API', () => {
  test('should return healthy status from /health', async () => {
    const response = await fetch(`${API_BASE}/health`);

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('database', 'connected');
  });

  test('should return ready from /ready', async () => {
    const response = await fetch(`${API_BASE}/ready`);

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
    expect(data).toHaveProperty('ready', true);
  });

  test('should not require authentication for health endpoints', async () => {
    // /health without any Authorization header
    const healthResponse = await fetch(`${API_BASE}/health`, {
      headers: {
        // Intentionally no Authorization header
      },
    });
    expect(healthResponse.ok).toBe(true);
    expect(healthResponse.status).toBe(200);

    const healthData = await healthResponse.json();
    expect(healthData).toHaveProperty('status', 'ok');

    // /ready without any Authorization header
    const readyResponse = await fetch(`${API_BASE}/ready`, {
      headers: {
        // Intentionally no Authorization header
      },
    });
    expect(readyResponse.ok).toBe(true);
    expect(readyResponse.status).toBe(200);

    const readyData = await readyResponse.json();
    expect(readyData).toHaveProperty('ready', true);
  });
});
