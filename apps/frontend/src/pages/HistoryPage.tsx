import type { ConfigType, HistoryAction, HistoryEntry } from '@/api/configs.api';
import { HistoryPreviewDialog } from '@/components/history/HistoryPreviewDialog';
import { RollbackDialog } from '@/components/history/RollbackDialog';
import {
    Badge,
    Breadcrumbs,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    EmptyHistory,
    Skeleton,
    toastMessages,
    useToast,
} from '@/components/ui';
import { configKeys, useProductHistoryInfinite, useRollbackConfig } from '@/hooks/useConfigs';
import { useProduct } from '@/hooks/useProducts';
import { useIsAdmin } from '@/hooks/useRole';
import { formatTime, groupByDateGroup } from '@/utils/date.utils';
import { useQueryClient } from '@tanstack/react-query';
import {
    Eye,
    Filter,
    History,
    Loader2,
    RotateCcw,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

type FilterValue = 'all' | ConfigType;

// Formatuje configType do czytelnej nazwy (np. "coveragesMeta" -> "Coverages Meta")
function formatConfigTypeName(configType: string): string {
    return configType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

interface HistoryEntryItemProps {
    entry: HistoryEntry;
    onPreview: (entry: HistoryEntry) => void;
    onRollback: (entry: HistoryEntry) => void;
    isCurrentVersion: boolean;
    isAdmin: boolean;
}

const ACTION_BADGES: Record<HistoryAction, { variant: 'success' | 'info' | 'purple' | 'warning'; label: string }> = {
    create: { variant: 'success', label: 'Utworzono' },
    update: { variant: 'info', label: 'Edycja' },
    publish: { variant: 'purple', label: 'Publikacja' },
    rollback: { variant: 'warning', label: 'Rollback' },
};

function HistoryEntryItem({ entry, onPreview, onRollback, isCurrentVersion, isAdmin }: HistoryEntryItemProps) {
    const actionBadge = ACTION_BADGES[entry.action];

    return (
        <div data-testid={`history-entry-${entry.id}`} className="flex items-center gap-4 py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors">
            <div data-testid={`history-entry-time-${entry.id}`} className="w-16 text-sm font-medium text-muted-foreground">
                {formatTime(entry.changedAt)}
            </div>

            <Badge data-testid={`history-entry-type-${entry.id}`} variant="outline" className="w-24 justify-center">
                {formatConfigTypeName(entry.configType)}
            </Badge>

            <div data-testid={`history-entry-version-${entry.id}`} className="w-12 text-sm font-medium">
                v{entry.version}
            </div>

            <Badge data-testid={`history-entry-action-${entry.id}`} variant={actionBadge.variant} className="w-24 justify-center">
                {actionBadge.label}
            </Badge>

            <div className="flex-1 text-sm text-muted-foreground truncate">
                {entry.changedByName}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    data-testid={`history-entry-preview-button-${entry.id}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview(entry)}
                    className="gap-1"
                >
                    <Eye className="h-4 w-4" />
                    Podgląd
                </Button>
                {isAdmin && !isCurrentVersion && (
                    <Button
                        data-testid={`history-entry-rollback-button-${entry.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => onRollback(entry)}
                        className="gap-1"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Rollback
                    </Button>
                )}
            </div>
        </div>
    );
}

function DateGroupHeader({ label }: { label: string }) {
    return (
        <div data-testid={`history-date-group-${label}`} className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-medium text-muted-foreground px-2">
                {label}
            </span>
            <div className="h-px flex-1 bg-border" />
        </div>
    );
}

function HistorySkeleton() {
    return (
        <div data-testid="history-loading-skeleton" className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 px-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    );
}

function FilterDropdown({
    value,
    onChange,
    availableConfigTypes,
}: {
    value: FilterValue;
    onChange: (value: FilterValue) => void;
    availableConfigTypes: string[];
}) {
    // Buduj opcje dynamicznie na podstawie dostępnych typów konfiguracji
    const filterOptions = useMemo(() => {
        const options: { value: FilterValue; label: string }[] = [
            { value: 'all', label: 'Wszystkie' },
        ];
        for (const configType of availableConfigTypes) {
            options.push({
                value: configType,
                label: formatConfigTypeName(configType),
            });
        }
        return options;
    }, [availableConfigTypes]);

    return (
        <div className="relative">
            <select
                data-testid="history-filter-dropdown"
                value={value}
                onChange={(e) => onChange(e.target.value as FilterValue)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none pr-8 cursor-pointer"
            >
                {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
    );
}

export function HistoryPage() {
    const { id: productId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const isAdmin = useIsAdmin();

    const [filter, setFilter] = useState<FilterValue>('all');
    const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);
    const [rollbackEntry, setRollbackEntry] = useState<HistoryEntry | null>(null);

    const { data: productData, isLoading: isLoadingProduct } = useProduct(productId);
    const configType = filter === 'all' ? undefined : filter;

    const {
        data: historyData,
        isLoading: isLoadingHistory,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useProductHistoryInfinite(productId, configType);

    const rollbackMutation = useRollbackConfig();

    const allEntries = useMemo(() => {
        if (!historyData?.pages) return [];
        return historyData.pages.flatMap((page) => page.history);
    }, [historyData]);

    // Wyciągnij unikalne typy konfiguracji z historii
    const availableConfigTypes = useMemo(() => {
        const types = new Set<string>();
        for (const entry of allEntries) {
            types.add(entry.configType);
        }
        return Array.from(types).sort();
    }, [allEntries]);

    const groupedEntries = useMemo(() => {
        return groupByDateGroup(allEntries, (entry) => entry.changedAt);
    }, [allEntries]);

    const currentVersions = useMemo(() => {
        const versions: Record<string, number> = {};
        for (const entry of allEntries) {
            const key = entry.configType;
            if (versions[key] === undefined || entry.version > versions[key]) {
                versions[key] = entry.version;
            }
        }
        return versions;
    }, [allEntries]);

    const handlePreview = useCallback((entry: HistoryEntry) => {
        setPreviewEntry(entry);
    }, []);

    const handleRollbackClick = useCallback((entry: HistoryEntry) => {
        setRollbackEntry(entry);
    }, []);

    const handleRollbackConfirm = useCallback(
        async (entry: HistoryEntry) => {
            if (!productId) return;

            try {
                await rollbackMutation.mutateAsync({
                    productId,
                    configType: entry.configType,
                    historyId: entry.id,
                });
                setRollbackEntry(null);
                setPreviewEntry(null);
                queryClient.invalidateQueries({ queryKey: configKeys.histories() });
                toast(toastMessages.rollbackSuccess);
            } catch (error) {
                console.error('Rollback failed:', error);
                toast(toastMessages.rollbackError);
            }
        },
        [productId, rollbackMutation, queryClient, toast]
    );

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const isCurrentVersion = useCallback(
        (entry: HistoryEntry) => {
            return currentVersions[entry.configType] === entry.version;
        },
        [currentVersions]
    );

    if (isLoadingProduct) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Card>
                    <CardContent className="pt-6">
                        <HistorySkeleton />
                    </CardContent>
                </Card>
            </div>
        );
    }

    const product = productData?.product;

    return (
        <div className="space-y-6">
            <Breadcrumbs
                items={[
                    { label: 'Produkty', href: '/products' },
                    { label: product?.name ?? 'Produkt', href: `/products/${productId}` },
                    { label: 'Historia' },
                ]}
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 data-testid="history-page-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Historia zmian</h1>
                    <p className="text-muted-foreground">
                        Przeglądaj i przywracaj poprzednie wersje konfiguracji
                    </p>
                </div>
                <FilterDropdown value={filter} onChange={setFilter} availableConfigTypes={availableConfigTypes} />
            </div>

            <Card data-testid="history-timeline-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Timeline zmian
                    </CardTitle>
                    <CardDescription>
                        Historia wszystkich zmian konfiguracji produktu
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    {isLoadingHistory ? (
                        <HistorySkeleton />
                    ) : allEntries.length === 0 ? (
                        <div data-testid="history-empty-state">
                            <EmptyHistory />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {Array.from(groupedEntries.entries()).map(([dateGroup, entries]) => (
                                <div key={dateGroup}>
                                    <DateGroupHeader label={dateGroup} />
                                    <div className="space-y-1">
                                        {entries.map((entry) => (
                                            <HistoryEntryItem
                                                key={entry.id}
                                                entry={entry}
                                                onPreview={handlePreview}
                                                onRollback={handleRollbackClick}
                                                isCurrentVersion={isCurrentVersion(entry)}
                                                isAdmin={isAdmin}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {hasNextPage && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        data-testid="history-load-more-button"
                                        variant="outline"
                                        onClick={handleLoadMore}
                                        disabled={isFetchingNextPage}
                                        className="gap-2"
                                    >
                                        {isFetchingNextPage ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Ładowanie...
                                            </>
                                        ) : (
                                            <>
                                                Załaduj więcej
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <HistoryPreviewDialog
                entry={previewEntry}
                open={previewEntry !== null}
                onOpenChange={(open) => {
                    if (!open) setPreviewEntry(null);
                }}
                {...(isAdmin && {
                    onRollback: (entry) => {
                        setPreviewEntry(null);
                        setRollbackEntry(entry);
                    },
                })}
                isCurrentVersion={previewEntry ? isCurrentVersion(previewEntry) : false}
            />

            <RollbackDialog
                entry={rollbackEntry}
                open={rollbackEntry !== null}
                onOpenChange={(open) => {
                    if (!open) setRollbackEntry(null);
                }}
                onConfirm={handleRollbackConfirm}
                isLoading={rollbackMutation.isPending}
            />
        </div>
    );
}
