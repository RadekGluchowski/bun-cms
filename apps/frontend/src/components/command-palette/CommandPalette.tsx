import { search, type SearchResponse, type SearchResult } from '@/api/search.api';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui';
import { useDebounce } from '@/hooks';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { FileText, Loader2, Package, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteProps {
    /** Whether the palette is open */
    isOpen: boolean;
    /** Callback to close the palette */
    onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const debouncedQuery = useDebounce(query, 300);

    // Combine all results into flat array for keyboard navigation
    const allResults: SearchResult[] = results
        ? [...results.products, ...results.configs]
        : [];

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults(null);
            setSelectedIndex(0);
            setError(null);
            // Focus input after dialog animation
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Perform search when debounced query changes
    useEffect(() => {
        async function performSearch() {
            if (debouncedQuery.length < 2) {
                setResults(null);
                setError(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await search(debouncedQuery);
                setResults(response);
                setSelectedIndex(0);
            } catch {
                setError('Wystąpił błąd podczas wyszukiwania');
                setResults(null);
            } finally {
                setIsLoading(false);
            }
        }

        performSearch();
    }, [debouncedQuery]);

    // Navigate to selected result
    const navigateToResult = useCallback(
        (result: SearchResult) => {
            navigate(result.url);
            onClose();
        },
        [navigate, onClose]
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < allResults.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : allResults.length - 1
                    );
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (allResults[selectedIndex]) {
                        navigateToResult(allResults[selectedIndex]);
                    }
                    break;
            }
        },
        [allResults, selectedIndex, navigateToResult]
    );

    // Scroll selected item into view
    useEffect(() => {
        const selectedElement = document.querySelector(
            `[data-result-index="${selectedIndex}"]`
        );
        selectedElement?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const hasResults = allResults.length > 0;
    const showNoResults =
        debouncedQuery.length >= 2 && !isLoading && !hasResults && !error;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogPortal>
                <DialogOverlay className="bg-black/50" />
                <DialogPrimitive.Content
                    className={cn(
                        'fixed left-[50%] top-[20%] z-50 w-full max-w-xl translate-x-[-50%] rounded-lg border bg-background shadow-2xl',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
                        'data-[state=closed]:slide-out-to-top-[10%] data-[state=open]:slide-in-from-top-[10%]'
                    )}
                    onKeyDown={handleKeyDown}
                    data-testid="command-palette"
                >
                    {/* Search Input */}
                    <div className="flex items-center border-b px-4">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Szukaj produktów i konfiguracji..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                            data-testid="command-palette-input"
                        />
                        {isLoading && (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {/* Results */}
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {/* Hint when no query */}
                        {query.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                <p>Wpisz minimum 2 znaki, aby wyszukać</p>
                                <p className="mt-2 text-xs">
                                    <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                        ↑↓
                                    </kbd>{' '}
                                    nawiguj{' '}
                                    <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                        Enter
                                    </kbd>{' '}
                                    wybierz{' '}
                                    <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                        Esc
                                    </kbd>{' '}
                                    zamknij
                                </p>
                            </div>
                        )}

                        {/* Query too short */}
                        {query.length === 1 && (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                Wpisz jeszcze {2 - query.length} znak
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="px-4 py-8 text-center text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* No results */}
                        {showNoResults && (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                Brak wyników dla "{debouncedQuery}"
                            </div>
                        )}

                        {/* Products section */}
                        {results && results.products.length > 0 && (
                            <div className="mb-2">
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    Produkty
                                </div>
                                {results.products.map((result, idx) => (
                                    <ResultItem
                                        key={result.id}
                                        result={result}
                                        index={idx}
                                        isSelected={selectedIndex === idx}
                                        onClick={() => navigateToResult(result)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Configs section */}
                        {results && results.configs.length > 0 && (
                            <div>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    Konfiguracje
                                </div>
                                {results.configs.map((result, idx) => {
                                    const globalIndex = (results?.products.length ?? 0) + idx;
                                    return (
                                        <ResultItem
                                            key={result.id}
                                            result={result}
                                            index={globalIndex}
                                            isSelected={selectedIndex === globalIndex}
                                            onClick={() => navigateToResult(result)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer with keyboard hints */}
                    {hasResults && (
                        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                            <span>
                                {allResults.length} wynik
                                {allResults.length === 1
                                    ? ''
                                    : allResults.length < 5
                                        ? 'i'
                                        : 'ów'}
                            </span>
                            <span>
                                <kbd className="rounded bg-muted px-1.5 py-0.5">↑↓</kbd> nawiguj{' '}
                                <kbd className="rounded bg-muted px-1.5 py-0.5">Enter</kbd> wybierz
                            </span>
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}

// ============================================
// Result Item Component
// ============================================

interface ResultItemProps {
    result: SearchResult;
    index: number;
    isSelected: boolean;
    onClick: () => void;
}

function ResultItem({ result, index, isSelected, onClick }: ResultItemProps) {
    const Icon = result.type === 'product' ? Package : FileText;

    return (
        <button
            type="button"
            data-result-index={index}
            onClick={onClick}
            className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                isSelected
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
            )}
        >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 overflow-hidden">
                <div className="truncate font-medium">{result.title}</div>
                {result.subtitle && (
                    <div className="truncate text-xs text-muted-foreground">
                        {result.subtitle}
                    </div>
                )}
            </div>
        </button>
    );
}
