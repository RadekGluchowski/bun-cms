import type { ConfigTypeStatus, Product } from '@/api/products.api';
import { AddConfigDialog } from '@/components/configs';
import { ProductFormDialog, ProductJsonDialog } from '@/components/products';
import {
    Badge,
    Breadcrumbs,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    ErrorState,
    PageSkeleton,
    toastMessages,
    useToast,
} from '@/components/ui';
import { useProduct } from '@/hooks';
import { useUpdateConfig } from '@/hooks/useConfigs';
import { formatDateTime, formatRelativeTime } from '@/utils/date.utils';
import type { ConfigDocument } from '@app/shared';
import {
    ChevronRight,
    Clock,
    Code,
    Edit,
    ExternalLink,
    FileText,
    History,
    Package,
    Plus,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// Helper to format config type name for display
function formatConfigTypeName(configType: string): string {
    return configType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

function ProductInfoCard({ product }: { product: Product }) {
    return (
        <Card data-testid="product-detail-info-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    Informacje o produkcie
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Nazwa</p>
                    <p className="font-medium" data-testid="product-detail-name">{product.name}</p>
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Kod</p>
                    <p className="font-mono text-sm" data-testid="product-detail-code-value">{product.code}</p>
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Opis</p>
                    <p className={product.description ? '' : 'text-muted-foreground italic'} data-testid="product-detail-description">
                        {product.description ?? 'Brak opisu'}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">URL podglądu</p>
                    {product.previewUrl ? (
                        <a
                            href={product.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            data-testid="product-detail-preview-url"
                        >
                            {product.previewUrl}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    ) : (
                        <p className="text-muted-foreground italic" data-testid="product-detail-preview-url">Nie ustawiono</p>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={product.isActive ? 'success' : 'secondary'} data-testid="product-detail-status-badge">
                        {product.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </Badge>
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                        Ostatnia modyfikacja
                    </p>
                    <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span title={formatDateTime(product.updatedAt)}>
                            {formatRelativeTime(product.updatedAt)}
                        </span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function ConfigCard({
    config,
    productId,
}: {
    config: ConfigTypeStatus;
    productId: string;
}) {
    // Użyj meta.title jeśli dostępne, w przeciwnym razie sformatuj configType
    const displayTitle = config.meta?.title ?? formatConfigTypeName(config.configType);
    const description = config.meta?.description;
    const category = config.meta?.category;

    return (
        <Card className="transition-colors hover:bg-muted/50" data-testid={`product-detail-config-card-${config.configType}`}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-1">{displayTitle}</span>
                    </CardTitle>
                </div>
                {category && (
                    <Badge variant="outline" className="w-fit text-xs">
                        {category}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {description && (
                    <CardDescription className="text-xs line-clamp-2">
                        {description}
                    </CardDescription>
                )}
                <div className="flex flex-wrap gap-2">
                    {config.hasDraft && (
                        <Badge variant="warning" data-testid={`product-detail-config-card-draft-badge-${config.configType}`}>Draft</Badge>
                    )}
                    {config.hasPublished && (
                        <Badge variant="success" data-testid={`product-detail-config-card-published-badge-${config.configType}`}>
                            Published
                        </Badge>
                    )}
                    {!config.hasDraft && !config.hasPublished && (
                        <Badge variant="outline">Brak konfiguracji</Badge>
                    )}
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild data-testid={`product-detail-config-card-edit-button-${config.configType}`}>
                    <Link to={`/products/${productId}/configs/${config.configType}`}>
                        Edytuj
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function AddConfigCard({ onClick }: { onClick: () => void }) {
    return (
        <Card
            className="transition-colors hover:bg-muted/50 cursor-pointer border-dashed"
            onClick={onClick}
            data-testid="product-detail-add-config-card"
        >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[140px] py-6">
                <div className="rounded-full bg-muted p-3 mb-3">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Dodaj konfigurację</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Utwórz nowy typ
                </p>
            </CardContent>
        </Card>
    );
}

function newEmptyDocument(configType: string): ConfigDocument {
    return {
        meta: {
            title: formatConfigTypeName(configType),
            description: '',
            category: '',
            icon: '',
            schemaVersion: 1,
        },
        body: {},
    };
}

function ConfigsSection({
    configStatuses,
    productId,
}: {
    configStatuses: ConfigTypeStatus[];
    productId: string;
}) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const updateConfigMutation = useUpdateConfig();

    const existingTypes = configStatuses.map((c) => c.configType);

    const handleCreateConfig = async (configType: string) => {
        await updateConfigMutation.mutateAsync({
            productId,
            configType,
            data: newEmptyDocument(configType),
        });
        setIsAddDialogOpen(false);
        toast(toastMessages.draftSaved);
        navigate(`/products/${productId}/configs/${configType}`);
    };

    return (
        <>
            <Card data-testid="product-detail-configs-section">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        Konfiguracje
                    </CardTitle>
                    <CardDescription>
                        Zarządzaj konfiguracjami produktu
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {configStatuses.map((config) => (
                            <ConfigCard
                                key={config.configType}
                                config={config}
                                productId={productId}
                            />
                        ))}
                        <AddConfigCard onClick={() => setIsAddDialogOpen(true)} />
                    </div>
                </CardContent>
            </Card>

            <AddConfigDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onConfirm={handleCreateConfig}
                existingTypes={existingTypes}
                isLoading={updateConfigMutation.isPending}
            />
        </>
    );
}

export function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isJsonOpen, setIsJsonOpen] = useState(false);

    const { data, isLoading, isError, error, refetch } = useProduct(id);

    const product = data?.product;
    const configStatuses = data?.configStatuses ?? [];

    if (isLoading) {
        return <div data-testid="product-detail-loading-skeleton"><PageSkeleton /></div>;
    }

    if (isError || !product) {
        return (
            <div data-testid="product-detail-error-state">
                <ErrorState
                    message={error?.message ?? 'Nie znaleziono produktu'}
                    onRetry={() => refetch()}
                    showBack
                    backHref="/products"
                    backLabel="Powrót do listy"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs
                items={[
                    { label: 'Produkty', href: '/products' },
                    { label: product.name },
                ]}
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" data-testid="product-detail-title">{product.name}</h1>
                    <p className="text-muted-foreground font-mono" data-testid="product-detail-code">{product.code}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild className="flex-1 sm:flex-initial" data-testid="product-detail-history-button">
                        <Link to={`/products/${id}/history`}>
                            <History className="mr-2 h-4 w-4" />
                            Historia
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsJsonOpen(true)}
                        className="flex-1 sm:flex-initial"
                        data-testid="product-detail-json-button"
                    >
                        <Code className="mr-2 h-4 w-4" />
                        JSON
                    </Button>
                    <Button onClick={() => setIsFormOpen(true)} className="flex-1 sm:flex-initial" data-testid="product-detail-edit-button">
                        <Edit className="mr-2 h-4 w-4" />
                        Edytuj
                    </Button>
                </div>
            </div>

            <ProductInfoCard product={product} />

            <ConfigsSection configStatuses={configStatuses} productId={product.id} />

            <ProductFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                product={product}
            />

            <ProductJsonDialog
                productId={product.id}
                productName={product.name}
                open={isJsonOpen}
                onOpenChange={setIsJsonOpen}
            />
        </div>
    );
}
