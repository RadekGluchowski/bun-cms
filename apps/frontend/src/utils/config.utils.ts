import type { JsonValue } from '@app/shared';

export type ValueType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';

export interface JsonParseResult {
    ok: boolean;
    value?: JsonValue;
    error?: string;
}

export function getValueType(value: unknown): ValueType {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
}

export function parseValue(value: string, targetType: ValueType): unknown {
    switch (targetType) {
        case 'number': {
            const num = Number(value);
            return Number.isNaN(num) ? 0 : num;
        }
        case 'boolean':
            return value === 'true';
        case 'null':
            return null;
        case 'array':
        case 'object':
            try {
                return JSON.parse(value);
            } catch {
                return targetType === 'array' ? [] : {};
            }
        default:
            return value;
    }
}

export function tryParseJson(input: string): JsonParseResult {
    try {
        // JSON.parse returns any; we accept it as JsonValue at runtime.
        const value = JSON.parse(input) as JsonValue;
        return { ok: true, value };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}

export function formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
}
