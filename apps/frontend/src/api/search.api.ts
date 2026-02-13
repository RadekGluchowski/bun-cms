import type { SearchResponse } from '@app/shared';
import { apiClient } from './client';

export type { SearchResult, SearchResponse } from '@app/shared';

export function search(query: string): Promise<SearchResponse> {
    const encodedQuery = encodeURIComponent(query);
    return apiClient.get<SearchResponse>(`/search?q=${encodedQuery}`);
}
