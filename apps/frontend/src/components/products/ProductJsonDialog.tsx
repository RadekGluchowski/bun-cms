import type { ProductExport } from '@/api/products.api';
import { productsApi } from '@/api/products.api';
import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Textarea,
    useToast,
} from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Check, Code, Copy, Download, Info, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ProductJsonDialogProps {
    productId: string;
    productName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatExportJson(exportData: ProductExport): string {
    return JSON.stringify(exportData, null, 2);
}

export function ProductJsonDialog({
    productId,
    productName,
    open,
    onOpenChange,
}: ProductJsonDialogProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const {
        data: exportData,
        isLoading,
        error: exportError,
        refetch,
    } = useQuery({
        queryKey: ['product-export', productId],
        queryFn: () => productsApi.exportProduct(productId),
        enabled: open,
        staleTime: 0,
    });

    const fullExportJson = useMemo(() => {
        if (!exportData) return '';
        return formatExportJson(exportData);
    }, [exportData]);

    const configVersions = useMemo(() => {
        if (!exportData) return [];
        return exportData.configs.map(c => ({
            configType: c.configType,
            version: c.version,
            status: c.status,
        }));
    }, [exportData]);

    useEffect(() => {
        if (!open) {
            setCopied(false);
        }
    }, [open]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(fullExportJson);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({
                title: 'Skopiowano',
                description: 'JSON skopiowany do schowka',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Błąd',
                description: 'Nie udało się skopiować',
                variant: 'error',
            });
        }
    }, [fullExportJson, toast]);

    const handleDownload = useCallback(() => {
        const blob = new Blob([fullExportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
            title: 'Pobrano',
            description: 'JSON został pobrany',
            variant: 'success',
        });
    }, [fullExportJson, productName, toast]);

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-testid="product-json-dialog">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        JSON - {productName}
                    </DialogTitle>
                    <DialogDescription>
                        Eksportuj konfigurację produktu jako JSON.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 space-y-4">
                    {/* Version Info */}
                    {configVersions.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">Wersje:</span>
                            <div className="flex flex-wrap gap-2">
                                {configVersions.map(cv => (
                                    <Badge
                                        key={cv.configType}
                                        variant={cv.status === 'published' ? 'success' : 'warning'}
                                    >
                                        {cv.configType}: v{cv.version} ({cv.status})
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Odśwież'
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            data-testid="product-json-copy-button"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            <span className="ml-1">Kopiuj</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            data-testid="product-json-download-button"
                        >
                            <Download className="h-4 w-4" />
                            <span className="ml-1">Pobierz</span>
                        </Button>
                    </div>

                    {/* JSON Viewer */}
                    {isLoading ? (
                        <div className="flex items-center justify-center h-96 bg-muted/30 rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : exportError ? (
                        <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                Błąd ładowania: {exportError instanceof Error ? exportError.message : 'Nieznany błąd'}
                            </p>
                            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
                                Spróbuj ponownie
                            </Button>
                        </div>
                    ) : (
                        <Textarea
                            value={fullExportJson}
                            readOnly
                            className="font-mono text-sm h-96 resize-none"
                            data-testid="product-json-textarea"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
