import type { ConfigDocument, JsonValue } from '@app/shared';

export function newEmptyDocument(configType: string): ConfigDocument {
    return {
        meta: {
            title: configType,
            description: '',
            category: '',
            icon: '',
            schemaVersion: 1,
        },
        body: {},
    };
}

/**
 * Ensures that a config document has valid structure.
 * If data is missing or malformed, returns a new empty document.
 */
export function ensureValidDocument(data: unknown, configType: string): ConfigDocument {
    if (!data || typeof data !== 'object') {
        return newEmptyDocument(configType);
    }

    const doc = data as Record<string, unknown>;

    // Ensure meta exists and has required title
    if (!doc.meta || typeof doc.meta !== 'object') {
        return newEmptyDocument(configType);
    }

    const meta = doc.meta as Record<string, unknown>;
    if (typeof meta.title !== 'string' || meta.title.length === 0) {
        return {
            meta: {
                title: configType,
                description: typeof meta.description === 'string' ? meta.description : '',
                category: typeof meta.category === 'string' ? meta.category : '',
                icon: typeof meta.icon === 'string' ? meta.icon : '',
                schemaVersion: typeof meta.schemaVersion === 'number' ? meta.schemaVersion : 1,
            },
            body: (doc.body ?? {}) as JsonValue,
        };
    }

    return data as ConfigDocument;
}
