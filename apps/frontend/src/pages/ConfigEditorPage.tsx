import type { ConfigType } from '@/api/configs.api';
import {
    ConfigEditorEmptyState,
    ConfigEditorErrorState,
    ConfigEditorSkeleton,
    ConfigTab,
    PublishDialog,
} from '@/components/configs';
import {
    Badge,
    Breadcrumbs,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Textarea,
    toastMessages,
    useToast,
} from '@/components/ui';
import {
    useConfig,
    useConfigStatuses,
    usePublishConfig,
    useUpdateConfig,
} from '@/hooks/useConfigs';
import { useProduct } from '@/hooks/useProducts';
import { useIsAdmin } from '@/hooks/useRole';
import { cn } from '@/lib/utils';
import { formatJson, tryParseJson } from '@/utils';
import type { ConfigDocument, ConfigMeta, JsonValue } from '@app/shared';
import { ExternalLink, Eye, Loader2, Save, Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ensureValidDocument, formatConfigTypeName, newEmptyDocument } from './ConfigEditorPage.utils';

export function ConfigEditorPage() {
    const { id: productId, type: configTypeParam } = useParams<{ id: string; type: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const isAdmin = useIsAdmin();

    const configType = configTypeParam ?? '';

    const [localDoc, setLocalDoc] = useState<ConfigDocument | null>(null);
    const [jsonText, setJsonText] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [metaErrors, setMetaErrors] = useState<{ title?: string } | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

    const {
        data: productData,
        isLoading: isLoadingProduct,
        isError: isProductError,
        error: productError,
        refetch: refetchProduct,
    } = useProduct(productId);

    const { data: statusesData, refetch: refetchStatuses } = useConfigStatuses(productId);

    const {
        data: configData,
        isLoading: isLoadingConfig,
        isError: isConfigError,
        error: configError,
        refetch: refetchConfig,
    } = useConfig(productId, configType);

    const updateConfigMutation = useUpdateConfig();
    const publishConfigMutation = usePublishConfig();

    const product = productData?.product;
    const config = configData;
    const statuses = statusesData;

    // Get available config types from statuses (dynamic)
    const availableConfigTypes = useMemo(() => {
        return statuses ? Object.keys(statuses) : [];
    }, [statuses]);

    // Current config status info
    const currentStatus = configType && statuses ? statuses[configType] : undefined;
    const hasDraft = currentStatus?.hasDraft ?? false;
    const hasPublished = currentStatus?.hasPublished ?? false;

    // Check which tabs have pending changes (draft but no published, or draft version > published version)
    const tabsWithPendingChanges = useMemo(() => {
        const pending: Set<ConfigType> = new Set();
        if (statuses) {
            for (const [type, status] of Object.entries(statuses)) {
                if (status?.hasDraft) {
                    pending.add(type);
                }
            }
        }
        return pending;
    }, [statuses]);

    useEffect(() => {
        if (!config?.data) return;
        const validDoc = ensureValidDocument(config.data, configType);
        setLocalDoc(validDoc);
        setJsonText(formatJson(validDoc.body));
        setJsonError(null);
        setMetaErrors(null);
        setHasUnsavedChanges(false);
    }, [config?.data, configType]);

    const validateMeta = useCallback((meta: ConfigMeta) => {
        const errors: { title?: string } = {};
        if (!meta.title || meta.title.trim().length === 0) {
            errors.title = 'Tytuł jest wymagany';
        }
        setMetaErrors(Object.keys(errors).length ? errors : null);
        return errors;
    }, []);

    const patchMeta = useCallback(
        (patch: Partial<ConfigMeta>) => {
            setLocalDoc((prev) => {
                const base = prev ?? ensureValidDocument(config?.data, configType);
                const next: ConfigDocument = { ...base, meta: { ...base.meta, ...patch } };
                validateMeta(next.meta);
                return next;
            });
            setHasUnsavedChanges(true);
        },
        [config?.data, configType, validateMeta]
    );

    const handleJsonTextChange = useCallback(
        (text: string) => {
            setJsonText(text);
            const parsed = tryParseJson(text);
            if (!parsed.ok) {
                setJsonError(parsed.error ?? 'Nieprawidłowy JSON');
                setHasUnsavedChanges(true);
                return;
            }
            setJsonError(null);

            setLocalDoc((prev) => {
                const base = prev ?? ensureValidDocument(config?.data, configType);
                return { ...base, body: parsed.value as JsonValue };
            });
            setHasUnsavedChanges(true);
        },
        [config?.data, configType]
    );

    const hasValidationErrors = Boolean(metaErrors?.title) || Boolean(jsonError);

    const isLoading = isLoadingProduct || isLoadingConfig;
    if (isLoading) return <ConfigEditorSkeleton />;

    if (isProductError) {
        return (
            <ConfigEditorErrorState
                message={productError?.message ?? 'Nie udało się załadować produktu'}
                onRetry={() => refetchProduct()}
            />
        );
    }

    const isConfigNotFound = isConfigError && (configError as { status?: number }).status === 404;

    if (isConfigError && !isConfigNotFound) {
        return (
            <ConfigEditorErrorState
                message={(configError as Error)?.message ?? 'Nie udało się załadować konfiguracji'}
                onRetry={() => refetchConfig()}
            />
        );
    }

    if (!productId || !configType) {
        return (
            <ConfigEditorErrorState
                message="Brak parametrów routingu"
                onRetry={() => navigate('/products')}
            />
        );
    }

    const handleCreateDraft = async () => {
        await updateConfigMutation.mutateAsync({
            productId,
            configType,
            data: newEmptyDocument(configType),
        });
        toast(toastMessages.draftSaved);
    };

    if (!product) {
        return (
            <ConfigEditorErrorState message="Nie znaleziono produktu" onRetry={() => refetchProduct()} />
        );
    }

    if ((!config || isConfigNotFound) && !hasDraft && !hasPublished) {
        return (
            <ConfigEditorEmptyState
                configType={configType}
                onCreateDraft={handleCreateDraft}
                isCreating={updateConfigMutation.isPending}
            />
        );
    }

    const doc = localDoc ?? ensureValidDocument(config?.data, configType);

    const handleSave = async () => {
        if (hasValidationErrors) return;
        validateMeta(doc.meta);
        if (!doc.meta.title || doc.meta.title.trim().length === 0) return;

        await updateConfigMutation.mutateAsync({
            productId,
            configType,
            data: doc,
        });
        // Force refetch statuses to get updated hasDraft/hasPublished
        await refetchStatuses();
        setHasUnsavedChanges(false);
        toast(toastMessages.draftSaved);
    };

    const handlePublish = async () => {
        if (hasValidationErrors) return;
        if (hasUnsavedChanges) {
            await handleSave();
        }
        await publishConfigMutation.mutateAsync({ productId, configType });
        // Force refetch statuses to get updated hasDraft/hasPublished
        await refetchStatuses();
        setIsPublishDialogOpen(false);
        setHasUnsavedChanges(false);
        toast(toastMessages.configPublished);
    };

    return (
        <div className="space-y-6">
            <Breadcrumbs
                data-testid="config-editor-breadcrumbs"
                items={[
                    { label: 'Produkty', href: '/products' },
                    { label: product.name, href: `/products/${productId}` },
                    { label: 'Konfiguracje', href: `/products/${productId}` },
                    { label: formatConfigTypeName(configType) },
                ]}
            />

            <div className="flex gap-2 border-b pb-2 overflow-x-auto" data-testid="config-editor-tabs">
                {availableConfigTypes.map((t) => (
                    <ConfigTab
                        key={t}
                        configType={t}
                        isActive={t === configType}
                        hasPendingChanges={tabsWithPendingChanges.has(t)}
                        onClick={() => navigate(`/products/${productId}/configs/${t}`)}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold" data-testid="config-editor-title">{formatConfigTypeName(configType)}</h1>
                    <Badge variant={hasDraft ? 'secondary' : 'outline'} data-testid="config-editor-draft-badge">
                        {hasDraft ? 'Draft' : 'Brak draftu'}
                    </Badge>
                    <Badge variant={hasPublished ? 'default' : 'outline'} data-testid="config-editor-published-badge">
                        {hasPublished ? 'Published' : 'Brak published'}
                    </Badge>
                </div>

                {product.previewUrl && (
                    <Button
                        variant="outline"
                        data-testid="config-editor-preview-button"
                        onClick={() => window.open(product.previewUrl!, '_blank', 'noopener,noreferrer')}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Podgląd
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="config-editor-meta-card">
                    <CardHeader>
                        <CardTitle>Meta (kafelek)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Tytuł *</label>
                            <Input
                                data-testid="config-editor-meta-title-input"
                                value={doc.meta.title}
                                onChange={(e) => patchMeta({ title: e.target.value })}
                                placeholder="np. SEO settings"
                            />
                            {metaErrors?.title && (
                                <p className="text-sm text-destructive" data-testid="config-editor-meta-title-error">{metaErrors.title}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Opis</label>
                            <Textarea
                                data-testid="config-editor-meta-description-input"
                                value={doc.meta.description ?? ''}
                                onChange={(e) => patchMeta({ description: e.target.value })}
                                placeholder="Krótki opis do kafelka"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Kategoria</label>
                                <Input
                                    data-testid="config-editor-meta-category-input"
                                    value={doc.meta.category ?? ''}
                                    onChange={(e) => patchMeta({ category: e.target.value })}
                                    placeholder="np. marketing"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Ikona</label>
                                <Input
                                    data-testid="config-editor-meta-icon-input"
                                    value={doc.meta.icon ?? ''}
                                    onChange={(e) => patchMeta({ icon: e.target.value })}
                                    placeholder="np. Search"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card data-testid="config-editor-body-card">
                    <CardHeader>
                        <CardTitle>Body (JSON)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Textarea
                            data-testid="config-editor-body-textarea"
                            value={jsonText}
                            onChange={(e) => handleJsonTextChange(e.target.value)}
                            className={cn('font-mono text-xs min-h-[420px]', jsonError && 'border-destructive')}
                            spellCheck={false}
                        />
                        {jsonError && <p className="text-sm text-destructive" data-testid="config-editor-body-error">{jsonError}</p>}
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap border-t pt-4">
                <div className="text-sm text-muted-foreground" data-testid="config-editor-status-text">
                    {hasValidationErrors
                        ? 'Napraw błędy przed zapisem/publikacją'
                        : hasUnsavedChanges
                            ? 'Masz niezapisane zmiany'
                            : 'Brak zmian'}
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        data-testid="config-editor-save-button"
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || updateConfigMutation.isPending || hasValidationErrors}
                        title={hasValidationErrors ? 'Napraw błędy walidacji przed zapisem' : undefined}
                    >
                        {updateConfigMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Zapisz
                    </Button>

                    {isAdmin && (
                        <Button
                            variant="default"
                            data-testid="config-editor-publish-button"
                            onClick={() => setIsPublishDialogOpen(true)}
                            disabled={!hasDraft || publishConfigMutation.isPending || hasValidationErrors}
                            title={hasValidationErrors ? 'Napraw błędy walidacji przed publikacją' : !hasDraft ? 'Brak draftu do publikacji' : undefined}
                        >
                            {publishConfigMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            Publikuj
                        </Button>
                    )}
                </div>
            </div>

            {isAdmin && (
                <PublishDialog
                    open={isPublishDialogOpen}
                    onOpenChange={setIsPublishDialogOpen}
                    onConfirm={handlePublish}
                    configType={configType}
                    draftVersion={config?.version ?? 0}
                    isLoading={publishConfigMutation.isPending}
                />
            )}
        </div>
    );
}
