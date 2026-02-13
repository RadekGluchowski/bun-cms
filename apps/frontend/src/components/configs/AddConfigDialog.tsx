import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Label,
} from '@/components/ui';
import { Loader2, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export interface AddConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (configType: string) => void;
    existingTypes: string[];
    isLoading?: boolean;
}

const CONFIG_TYPE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const MAX_LENGTH = 100;

function validateConfigType(
    value: string,
    existingTypes: string[]
): string | null {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
        return 'Nazwa typu jest wymagana';
    }

    if (trimmed.length > MAX_LENGTH) {
        return `Maksymalna długość to ${MAX_LENGTH} znaków`;
    }

    if (!CONFIG_TYPE_PATTERN.test(trimmed)) {
        return 'Dozwolone znaki: litery, cyfry, myślnik, podkreślenie. Musi zaczynać się od litery';
    }

    if (existingTypes.includes(trimmed)) {
        return 'Typ konfiguracji o tej nazwie już istnieje';
    }

    return null;
}

export function AddConfigDialog({
    open,
    onOpenChange,
    onConfirm,
    existingTypes,
    isLoading = false,
}: AddConfigDialogProps) {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setValue('');
            setError(null);
        }
    }, [open]);

    const handleSubmit = useCallback(() => {
        const trimmed = value.trim();
        const validationError = validateConfigType(trimmed, existingTypes);

        if (validationError) {
            setError(validationError);
            return;
        }

        onConfirm(trimmed);
    }, [value, existingTypes, onConfirm]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Enter' && !isLoading) {
                event.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit, isLoading]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" data-testid="add-config-dialog">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Nowa konfiguracja
                    </DialogTitle>
                    <DialogDescription>
                        Podaj nazwę nowego typu konfiguracji. Nazwa powinna być krótka
                        i opisowa (np. &quot;promocje&quot;, &quot;faq&quot;, &quot;seo&quot;).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    <Label htmlFor="config-type-name">Nazwa typu</Label>
                    <Input
                        id="config-type-name"
                        data-testid="add-config-type-input"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="np. promocje"
                        autoFocus
                        disabled={isLoading}
                    />
                    {error && (
                        <p className="text-sm text-destructive" data-testid="add-config-error-message">{error}</p>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        data-testid="add-config-cancel-button"
                    >
                        Anuluj
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || value.trim().length === 0}
                        data-testid="add-config-submit-button"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Tworzenie...
                            </>
                        ) : (
                            'Utwórz'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
