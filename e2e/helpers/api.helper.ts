import { API_BASE, ADMIN } from '../fixtures/test-data';

export class ApiHelper {
  private token: string | null = null;

  async login(): Promise<string> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }),
    });
    if (!res.ok) {
      throw new Error(`Login failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { token: string };
    this.token = data.token;
    return data.token;
  }

  private async getToken(): Promise<string> {
    if (!this.token) {
      await this.login();
    }
    return this.token!;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async createProduct(product: {
    code: string;
    name: string;
    description?: string;
    previewUrl?: string;
  }): Promise<{ id: string; code: string; name: string }> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Create product failed: ${res.status} - ${text}`);
    }
    return res.json() as Promise<{ id: string; code: string; name: string }>;
  }

  async deleteProduct(id: string): Promise<void> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Delete product failed: ${res.status}`);
    }
  }

  async getProducts(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Array<{ id: string; code: string; name: string }>; total: number }> {
    const headers = await this.authHeaders();
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/api/products?${searchParams.toString()}`, {
      headers,
    });
    if (!res.ok) {
      throw new Error(`Get products failed: ${res.status}`);
    }
    return res.json() as Promise<{ products: Array<{ id: string; code: string; name: string }>; total: number }>;
  }

  async getProduct(id: string): Promise<{ product: { id: string; code: string; name: string } }> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/products/${id}`, { headers });
    if (!res.ok) {
      throw new Error(`Get product failed: ${res.status}`);
    }
    return res.json() as Promise<{ product: { id: string; code: string; name: string } }>;
  }

  async updateProduct(
    id: string,
    data: { name?: string; description?: string | null; previewUrl?: string | null }
  ): Promise<{ id: string; name: string }> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Update product failed: ${res.status}`);
    }
    return res.json() as Promise<{ id: string; name: string }>;
  }

  async saveConfig(
    productId: string,
    configType: string,
    data: object
  ): Promise<{ id: string; version: number }> {
    const headers = await this.authHeaders();
    const res = await fetch(
      `${API_BASE}/api/products/${productId}/configs/${configType}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Save config failed: ${res.status} - ${text}`);
    }
    return res.json() as Promise<{ id: string; version: number }>;
  }

  async publishConfig(
    productId: string,
    configType: string
  ): Promise<{ id: string; version: number }> {
    const headers = await this.authHeaders();
    const res = await fetch(
      `${API_BASE}/api/products/${productId}/configs/${configType}/publish`,
      {
        method: 'POST',
        headers,
      }
    );
    if (!res.ok) {
      throw new Error(`Publish config failed: ${res.status}`);
    }
    return res.json() as Promise<{ id: string; version: number }>;
  }

  async getConfig(
    productId: string,
    configType: string,
    status?: string
  ): Promise<{ id: string; data: object; version: number; status: string } | null> {
    const headers = await this.authHeaders();
    const params = status ? `?status=${status}` : '';
    const res = await fetch(
      `${API_BASE}/api/products/${productId}/configs/${configType}${params}`,
      { headers }
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Get config failed: ${res.status}`);
    }
    return res.json() as Promise<{ id: string; data: object; version: number; status: string }>;
  }

  async getHistory(
    productId: string,
    params?: { configType?: string; page?: number; limit?: number }
  ): Promise<{ history: Array<{ id: string; configType: string; version: number; action: string }> }> {
    const headers = await this.authHeaders();
    const searchParams = new URLSearchParams();
    if (params?.configType) searchParams.set('configType', params.configType);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const res = await fetch(
      `${API_BASE}/api/products/${productId}/history?${searchParams.toString()}`,
      { headers }
    );
    if (!res.ok) {
      throw new Error(`Get history failed: ${res.status}`);
    }
    return res.json() as Promise<{ history: Array<{ id: string; configType: string; version: number; action: string }> }>;
  }

  async getPublicConfig(productCode: string): Promise<object | null> {
    const res = await fetch(`${API_BASE}/api/public/products/${productCode}/config`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Get public config failed: ${res.status}`);
    }
    return res.json() as Promise<object>;
  }

  async getDraftPreview(configId: string): Promise<object | null> {
    const res = await fetch(`${API_BASE}/api/public/draft/${configId}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Get draft preview failed: ${res.status}`);
    }
    return res.json() as Promise<object>;
  }

  async healthCheck(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json() as Promise<{ status: string }>;
  }

  async readyCheck(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/ready`);
    return res.json() as Promise<{ status: string }>;
  }

  /**
   * Export a product by ID.
   */
  async exportProduct(id: string): Promise<object> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/products/${id}/export`, {
      headers,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Export product failed: ${res.status} - ${text}`);
    }
    return res.json() as Promise<object>;
  }

  /**
   * Import data into a product by ID.
   */
  async importProduct(id: string, data: object): Promise<object> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/products/${id}/import`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Import product failed: ${res.status} - ${text}`);
    }
    return res.json() as Promise<object>;
  }

  /**
   * Search across the CMS.
   */
  async search(query: string): Promise<object> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, {
      headers,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Search failed: ${res.status} - ${text}`);
    }
    return res.json() as Promise<object>;
  }

  /**
   * Get config statuses for a product (all config types).
   */
  async getConfigStatuses(
    productId: string
  ): Promise<Array<{ configType: string; status: string; version: number }>> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/products/${productId}/configs`, {
      headers,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Get config statuses failed: ${res.status} - ${text}`);
    }
    return res.json() as Promise<Array<{ configType: string; status: string; version: number }>>;
  }

  /**
   * Rollback a config to a specific history entry.
   */
  async rollback(
    productId: string,
    configType: string,
    historyId: string
  ): Promise<{ id: string; version: number }> {
    const headers = await this.authHeaders();
    const res = await fetch(
      `${API_BASE}/api/products/${productId}/configs/${configType}/rollback/${historyId}`,
      {
        method: 'POST',
        headers,
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Rollback failed: ${res.status} - ${text}`);
    }
    return res.json() as Promise<{ id: string; version: number }>;
  }

  /**
   * Get config history for a specific config type.
   */
  async getConfigHistory(
    productId: string,
    configType: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ history: Array<{ id: string; version: number; action: string; createdAt: string }>; total: number }> {
    const headers = await this.authHeaders();
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    const url = `${API_BASE}/api/products/${productId}/configs/${configType}/history${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Get config history failed: ${res.status} - ${text}`);
    }
    return res.json() as Promise<{ history: Array<{ id: string; version: number; action: string; createdAt: string }>; total: number }>;
  }

  /**
   * Clean up test products by searching for them and deleting.
   * Useful for teardown.
   */
  async cleanupTestProducts(codePrefix: string): Promise<void> {
    const { products } = await this.getProducts({ search: codePrefix, limit: 100 });
    for (const product of products) {
      if (product.code.startsWith(codePrefix)) {
        await this.deleteProduct(product.id);
      }
    }
  }

  // ── Admin Management ──────────────────────────────────────────────

  async listAdmins(): Promise<{
    admins: Array<{ id: string; email: string; name: string; role: string; createdAt: string; updatedAt: string }>;
    total: number;
  }> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/admins`, { headers });
    if (!res.ok) {
      throw new Error(`List admins failed: ${res.status}`);
    }
    return res.json() as Promise<{
      admins: Array<{ id: string; email: string; name: string; role: string; createdAt: string; updatedAt: string }>;
      total: number;
    }>;
  }

  async createAdmin(data: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'editor';
  }): Promise<{ id: string; email: string; name: string; role: string }> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/admins`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Create admin failed: ${res.status} - ${text}`);
    }
    return res.json() as Promise<{ id: string; email: string; name: string; role: string }>;
  }

  async updateAdmin(
    id: string,
    data: { name?: string; role?: 'admin' | 'editor' }
  ): Promise<{ id: string; email: string; name: string; role: string }> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/admins/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Update admin failed: ${res.status}`);
    }
    return res.json() as Promise<{ id: string; email: string; name: string; role: string }>;
  }

  async deleteAdmin(id: string): Promise<void> {
    const headers = await this.authHeaders();
    const res = await fetch(`${API_BASE}/api/admins/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Delete admin failed: ${res.status}`);
    }
  }

  /**
   * Login with specific credentials (not the default admin).
   * Returns token and admin object but does NOT cache as the default token.
   */
  async loginAs(
    email: string,
    password: string
  ): Promise<{ token: string; admin: { id: string; email: string; name: string; role: string } }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error(`Login as ${email} failed: ${res.status}`);
    }
    return res.json() as Promise<{
      token: string;
      admin: { id: string; email: string; name: string; role: string };
    }>;
  }

  /**
   * Make a raw authenticated request (for testing 403 responses).
   */
  async rawRequest(
    method: string,
    path: string,
    body?: object,
    token?: string
  ): Promise<{ status: number; body: unknown }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? (await this.getToken())}`,
    };
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const responseBody = await res.json().catch(() => null);
    return { status: res.status, body: responseBody };
  }
}
