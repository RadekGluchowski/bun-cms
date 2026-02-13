import type { Product } from '@/api/products.api';
import { DeleteProductDialog, ProductFormDialog } from '@/components/products';
import {
    Badge,
    Breadcrumbs,
    Button,
    Card,
    CardContent,
    EmptyState,
    ErrorState,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSkeleton,
    toastMessages,
    useToast,
} from '@/components/ui';
import { useDebounce, useDeleteProduct, useIsAdmin, useProductsList } from '@/hooks';
import { formatRelativeTime } from '@/utils/date.utils';
import { ChevronLeft, ChevronRight, Edit, Package, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 10;

function ConfigStatusBadges({ product }: { product: Product }) {
    return (
        <Badge variant="secondary">
            {product.isActive ? 'Aktywny' : 'Nieaktywny'}
        </Badge>
    );
}

export function ProductsListPage() {
    const { toast } = useToast();
    const isAdmin = useIsAdmin();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    const debouncedSearch = useDebounce(search, 300);

    const effectiveSearch = debouncedSearch.trim();

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useProductsList({
        search: effectiveSearch || undefined,
        page,
        limit: PAGE_SIZE,
    });

    const deleteMutation = useDeleteProduct();

    const products = data?.products ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    function handleSearchChange(value: string) {
        setSearch(value);
        setPage(1);
    }

    function handlePageChange(newPage: number) {
        setPage(newPage);
    }

    function handleAddProduct() {
        setEditingProduct(null);
        setIsFormOpen(true);
    }

    function handleEditProduct(product: Product) {
        setEditingProduct(product);
        setIsFormOpen(true);
    }

    function handleDeleteClick(product: Product) {
        setDeletingProduct(product);
    }

    async function handleConfirmDelete() {
        if (!deletingProduct) return;

        try {
            await deleteMutation.mutateAsync(deletingProduct.id);
            setDeletingProduct(null);
            toast(toastMessages.productDeleted);
        } catch {
            toast(toastMessages.productError);
        }
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: 'Produkty' }]} />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 data-testid="products-page-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Produkty</h1>
                    <p className="text-muted-foreground">
                        Zarządzaj produktami i konfiguracjami
                    </p>
                </div>
                <Button data-testid="products-add-button" onClick={handleAddProduct} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj produkt
                </Button>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    data-testid="products-search-input"
                    placeholder="Szukaj produktów..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Products Table */}
            {/* Products Table */}
            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    {isLoading ? (
                        <div data-testid="products-loading-skeleton">
                            <TableSkeleton rows={5} columns={5} />
                        </div>
                    ) : isError ? (
                        <div data-testid="products-error-state">
                            <ErrorState
                                message={error?.message ?? 'Nie udało się pobrać produktów'}
                                onRetry={() => refetch()}
                            />
                        </div>
                    ) : products.length === 0 ? (
                        effectiveSearch ? (
                            <div data-testid="products-search-empty-state">
                                <EmptyState
                                    icon={Search}
                                    title="Brak wyników"
                                    description="Nie znaleziono produktów pasujących do wyszukiwania."
                                />
                            </div>
                        ) : (
                            <div data-testid="products-empty-state">
                                <EmptyState
                                    icon={Package}
                                    title="Brak produktów"
                                    description="Zacznij od dodania pierwszego produktu."
                                    action={{ label: 'Dodaj produkt', onClick: handleAddProduct }}
                                />
                            </div>
                        )
                    ) : (
                        <Table data-testid="products-table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nazwa</TableHead>
                                    <TableHead className="hidden sm:table-cell">Kod</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Ostatnia zmiana</TableHead>
                                    <TableHead className="text-right">Akcje</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product, index) => (
                                    <TableRow key={product.id} data-testid={`products-table-row-${index}`}>
                                        <TableCell className="font-medium">
                                            <Link
                                                data-testid={`products-table-row-name-${index}`}
                                                to={`/products/${product.id}`}
                                                className="hover:text-primary hover:underline"
                                            >
                                                {product.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell data-testid={`products-table-row-code-${index}`} className="hidden sm:table-cell font-mono text-sm text-muted-foreground">
                                            {product.code}
                                        </TableCell>
                                        <TableCell data-testid={`products-table-row-status-${index}`}>
                                            <ConfigStatusBadges product={product} />
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">
                                            {formatRelativeTime(product.updatedAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 sm:gap-2">
                                                <Button
                                                    data-testid={`products-table-row-edit-button-${index}`}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditProduct(product)}
                                                    title="Edytuj"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {isAdmin && (
                                                    <Button
                                                        data-testid={`products-table-row-delete-button-${index}`}
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(product)}
                                                        title="Usuń"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {!isLoading && !isError && products.length > 0 && (
                <div data-testid="products-pagination" className="flex items-center justify-between">
                    <p data-testid="products-pagination-showing" className="text-sm text-muted-foreground">
                        Pokazano {(page - 1) * PAGE_SIZE + 1}-
                        {Math.min(page * PAGE_SIZE, total)} z {total} produktów
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            data-testid="products-pagination-prev"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Poprzednia
                        </Button>
                        <span data-testid="products-pagination-info" className="text-sm text-muted-foreground">
                            Strona {page} z {totalPages || 1}
                        </span>
                        <Button
                            data-testid="products-pagination-next"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                        >
                            Następna
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <ProductFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                product={editingProduct}
                onSuccess={() => {
                    toast(editingProduct ? toastMessages.productUpdated : toastMessages.productCreated);
                }}
            />

            {isAdmin && (
                <DeleteProductDialog
                    open={Boolean(deletingProduct)}
                    onOpenChange={(open) => !open && setDeletingProduct(null)}
                    productName={deletingProduct?.name ?? ''}
                    onConfirm={handleConfirmDelete}
                    isDeleting={deleteMutation.isPending}
                />
            )}
        </div>
    );
}