import type { ConfigType, HistoryEntry } from '@/api/configs.api';
import { JsonViewer } from '@/components/shared/JsonViewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTime } from '@/utils/date.utils';
import { History, RotateCcw } from 'lucide-react';

interface HistoryPreviewDialogProps {
    /** History entry to preview */
    entry: HistoryEntry | null;
    /** Whether dialog is open */
    open: boolean;
    /** Callback when dialog should close */
    onOpenChange: (open: boolean) => void;
    /** Callback when user wants to rollback to this version (hidden if undefined) */
    onRollback?: (entry: HistoryEntry) => void;
    /** Whether this entry is the current version (disable rollback) */
    isCurrentVersion?: boolean;
}

function getConfigTypeLabel(configType: ConfigType): string {
    const labels: Record<ConfigType, string> = {
        general: 'General',
        settings: 'Settings',
        metadata: 'Metadata',
        translations: 'Translations',
    };
    return labels[configType] ?? configType;
}

function getActionInfo(action: HistoryEntry['action']): { variant: 'success' | 'info' | 'purple' | 'warning'; label: string } {
    switch (action) {
        case 'create':
            return { variant: 'success', label: 'Utworzono' };
        case 'update':
            return { variant: 'info', label: 'Zaktualizowano' };
        case 'publish':
            return { variant: 'purple', label: 'Opublikowano' };
        case 'rollback':
            return { variant: 'warning', label: 'Przywrócono' };
        default:
            return { variant: 'info', label: action };
    }
}

export function HistoryPreviewDialog({
    entry,
    open,
    onOpenChange,
    onRollback,
    isCurrentVersion = false,
}: HistoryPreviewDialogProps) {
    if (!entry) {
        return null;
    }

    const actionInfo = getActionInfo(entry.action);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="history-preview-dialog">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Podgląd wersji v{entry.version}
                    </DialogTitle>
                    <DialogDescription>
                        Podgląd historycznej wersji konfiguracji
                    </DialogDescription>
                </DialogHeader>

                {/* Metadata section */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Typ konfiguracji</p>
                        <p className="font-medium">{getConfigTypeLabel(entry.configType)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Wersja</p>
                        <p className="font-medium">v{entry.version}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Data zmiany</p>
                        <p className="font-medium">{formatDateTime(entry.changedAt)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Autor</p>
                        <p className="font-medium">{entry.changedByName}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Akcja</p>
                        <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                    </div>
                    {isCurrentVersion && (
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant="secondary">Aktualna wersja</Badge>
                        </div>
                    )}
                </div>

                {/* JSON viewer section */}
                <div className="flex-1 overflow-auto min-h-0 py-4" data-testid="history-preview-json">
                    <p className="text-sm font-medium mb-2">Dane konfiguracji:</p>
                    <JsonViewer
                        data={entry.data}
                        maxAutoExpandDepth={2}
                        className="max-h-[400px]"
                    />
                </div>

                <DialogFooter className="flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        data-testid="history-preview-close-button"
                    >
                        Zamknij
                    </Button>
                    {onRollback && !isCurrentVersion && (
                        <Button
                            onClick={() => onRollback(entry)}
                            className="gap-2"
                            data-testid="history-preview-rollback-button"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Przywróć tę wersję
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
