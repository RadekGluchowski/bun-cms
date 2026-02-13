import type { HistoryEntry } from '@/api/configs.api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Info, RotateCcw } from 'lucide-react';

interface RollbackDialogProps {
    /** History entry to rollback to */
    entry: HistoryEntry | null;
    /** Whether dialog is open */
    open: boolean;
    /** Callback when dialog should close */
    onOpenChange: (open: boolean) => void;
    /** Callback to confirm rollback */
    onConfirm: (entry: HistoryEntry) => void;
    /** Whether rollback is in progress */
    isLoading?: boolean;
}

export function RollbackDialog({
    entry,
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
}: RollbackDialogProps) {
    if (!entry) {
        return null;
    }

    const handleConfirm = () => {
        onConfirm(entry);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md" data-testid="rollback-dialog">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5" />
                        Przywróć wersję
                    </DialogTitle>
                    <DialogDescription>
                        Potwierdzenie przywrócenia historycznej wersji konfiguracji
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Warning */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                Czy na pewno przywrócić wersję v{entry.version}?
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Ta operacja nie może być cofnięta automatycznie.
                            </p>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-medium text-blue-800 dark:text-blue-200">
                                Zostanie utworzony nowy draft
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Dane z wersji v{entry.version} zostaną skopiowane do nowego draftu.
                                Opublikowana wersja pozostanie bez zmian do czasu publikacji nowego draftu.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        data-testid="rollback-cancel-button"
                    >
                        Anuluj
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="gap-2"
                        data-testid="rollback-confirm-button"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Przywracanie...
                            </>
                        ) : (
                            <>
                                <RotateCcw className="h-4 w-4" />
                                Przywróć
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
