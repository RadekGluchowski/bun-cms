import { Elysia } from 'elysia';

import { AppError } from '../middleware/error.handler';
import { publicService } from './public.service';
import type { DraftPreviewBundleResponse, PublishedBundleResponse } from './public.types';
import { configIdParamSchema, productCodeParamSchema } from './public.types';

export const publicModule = new Elysia({ prefix: '/api/public' })
    .onError(({ error, set }) => {
        if (error instanceof AppError) {
            set.status = error.statusCode;
            return {
                error: error.name,
                message: error.message,
                statusCode: error.statusCode,
                code: error.code,
            };
        }
    })
    .get(
        '/products/:code/config',
        async ({ params, set }): Promise<PublishedBundleResponse> => {
            const bundle = await publicService.getPublishedBundle(params.code);

            set.headers['Cache-Control'] = 'public, max-age=60';

            return bundle;
        },
        {
            params: productCodeParamSchema,
            detail: {
                tags: ['Public'],
                summary: 'Get published config bundle',
                description:
                    'Returns all published configurations for a product assembled into a single bundle. ' +
                    'Use the product CODE (not ID) to fetch. ' +
                    'Response is cached for 60 seconds.',
            },
        }
    )
    .get(
        '/products/:code/draft',
        async ({ params, set }): Promise<DraftPreviewBundleResponse> => {
            const bundle = await publicService.getDraftBundle(params.code);

            set.headers['Cache-Control'] = 'no-store';

            return bundle;
        },
        {
            params: productCodeParamSchema,
            detail: {
                tags: ['Public'],
                summary: 'Get draft config bundle',
                description:
                    'Returns all configurations for a product with drafts overriding published versions. ' +
                    'Use the product CODE (not ID) to fetch. ' +
                    'Falls back to published config for types without a draft. ' +
                    'Response is NOT cached.',
            },
        }
    )
    .get(
        '/draft/:configId',
        async ({ params, set }): Promise<DraftPreviewBundleResponse> => {
            const bundle = await publicService.getDraftPreviewBundle(params.configId);

            set.headers['Cache-Control'] = 'no-store';

            return bundle;
        },
        {
            params: configIdParamSchema,
            detail: {
                tags: ['Public'],
                summary: 'Get draft preview bundle',
                description:
                    'Returns a preview bundle with a draft config overriding its type. ' +
                    'Published configs are used for all other types. ' +
                    'Use this endpoint to test unpublished changes. ' +
                    'Response is NOT cached.',
            },
        }
    );
