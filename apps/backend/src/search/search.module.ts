import { Elysia, t } from 'elysia';

import { authGuard } from '../auth/auth.guard';
import { BadRequestError } from '../middleware/error.handler';
import { searchService } from './search.service';

export const searchModule = new Elysia({ prefix: '/api/search' })
    .use(authGuard)
    .get(
        '',
        async ({ query }) => {
            const searchQuery = query.q?.trim() ?? '';

            if (searchQuery.length < 2) {
                throw new BadRequestError('Search query must be at least 2 characters');
            }

            const results = await searchService.search(searchQuery);

            return results;
        },
        {
            query: t.Object({
                q: t.String(),
            }),
        }
    );
