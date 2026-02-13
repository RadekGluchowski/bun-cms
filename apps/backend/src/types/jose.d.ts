/**
 * Module declarations for packages that need type resolution
 * 
 * This helps TypeScript resolve types from Bun's module cache
 */

// Re-export jose types to make them available
declare module 'jose' {
    export * from 'jose';
}
