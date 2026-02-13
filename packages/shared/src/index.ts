// Admin roles
export const ADMIN_ROLES = ['admin', 'editor'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

// ConfigType is now dynamic - any string is valid
export type ConfigType = string;

export const CONFIG_STATUSES = ['draft', 'published'] as const;
export type ConfigStatus = (typeof CONFIG_STATUSES)[number];

export const HISTORY_ACTIONS = ['create', 'update', 'publish', 'rollback'] as const;
export type HistoryAction = (typeof HISTORY_ACTIONS)[number];

export interface ConfigStatusInfo {
    hasDraft: boolean;
    hasPublished: boolean;
    draftVersion: number | null;
    publishedVersion: number | null;
}

// ConfigStatusesResponse is now a dynamic Record with string keys
export type ConfigStatusesResponse = Record<string, ConfigStatusInfo>;

/**
 * ConfigTypeStatus z dynamicznymi metadanymi z ConfigDocument.
 * Meta pochodzi z aktualnej konfiguracji (draft lub published).
 */
export interface ConfigTypeStatus {
    configType: ConfigType;
    hasDraft: boolean;
    hasPublished: boolean;
    draftVersion: number | null;
    publishedVersion: number | null;
    meta: ConfigMeta | null;
}

// -----------------------------
// Config-as-JSONB document model
// -----------------------------

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

/** Minimal metadata used to render a config "tile" in UI lists. */
export interface ConfigMeta {
    title: string;
    description?: string;
    category?: string;
    /** UI hint only; icon name (e.g. Lucide icon key). */
    icon?: string;
    /** Used for safe, iterative evolution of meta/body shape. */
    schemaVersion?: number;
}

/**
 * New canonical config representation stored in JSONB:
 * - meta: small, index-friendly info for UX
 * - body: arbitrary JSON payload (the actual configuration)
 */
export interface ConfigDocument {
    meta: ConfigMeta;
    body: JsonValue;
}

// -----------------------------
// Search types
// -----------------------------

export interface SearchResult {
    id: string;
    type: 'product' | 'config';
    title: string;
    subtitle?: string;
    url: string;
}

export interface SearchResponse {
    products: SearchResult[];
    configs: SearchResult[];
}

// -----------------------------
// Export / Import types
// -----------------------------

export interface ConfigExport {
    configType: ConfigType;
    data: unknown;
    version: number;
    status: ConfigStatus;
}

export interface ProductExport {
    product: {
        code: string;
        name: string;
        description: string | null;
        previewUrl: string | null;
    };
    configs: ConfigExport[];
    exportedAt: string;
    version: string;
}

export interface ImportProductRequest {
    product: {
        code?: string;
        name?: string;
        description?: string | null;
        previewUrl?: string | null;
    };
    configs: Array<{
        configType: ConfigType;
        data: unknown;
    }>;
}

// -----------------------------
// Common API response types
// -----------------------------

export interface DeleteProductResponse {
    success: true;
}
