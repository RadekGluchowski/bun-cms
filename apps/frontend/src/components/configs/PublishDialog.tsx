import type { ConfigType } from '@/api/configs.api';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface PublishDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when open state changes */
    onOpenChange: (open: boolean) => void;
    /** Callback when user confirms publish */
    onConfirm: () => void;
    /** Config type being published */
    configType: ConfigType;
    /** Current draft version */
    draftVersion: number;
    /** Whether publish is in progress */
    isLoading?: boolean;
}

const CONFIG_TYPE_NAMES: Record<ConfigType, string> = {
    general: 'General',
    settings: 'Settings',
    metadata: 'Metadata',
    translations: 'Translations',
};

export function PublishDialog({
    open,
    onOpenChange,
    onConfirm,
    configType,
    draftVersion,
    isLoading = false,
}: PublishDialogProps) {
    const configName = CONFIG_TYPE_NAMES[configType];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" data-testid="publish-dialog">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Potwierdź publikację
                    </DialogTitle>
                    <DialogDescription className="space-y-2">
                        <p>
                            Czy na pewno chcesz opublikować konfigurację{' '}
                            <strong>{configName}</strong> (wersja {draftVersion})?
                        </p>
                        <p className="text-amber-600 dark:text-amber-400 font-medium">
                            Ta operacja udostępni zmiany dla aplikacji produkcyjnych.
                        </p>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        data-testid="publish-cancel-button"
                    >
                        Anuluj
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid="publish-confirm-button"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publikowanie...
                            </>
                        ) : (
                            'Publikuj'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
