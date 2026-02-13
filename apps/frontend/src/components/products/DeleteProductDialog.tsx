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

interface DeleteProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productName: string;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeleteProductDialog({
    open,
    onOpenChange,
    productName,
    onConfirm,
    isDeleting,
}: DeleteProductDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" data-testid="delete-product-dialog">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <DialogTitle>Usuń produkt</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        Czy na pewno chcesz usunąć produkt{' '}
                        <span className="font-semibold text-foreground">
                            {productName}
                        </span>
                        ?
                        <br />
                        <br />
                        Ta operacja jest nieodwracalna. Wszystkie konfiguracje i historia
                        zmian powiązane z tym produktem zostaną usunięte.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        data-testid="delete-product-cancel-button"
                    >
                        Anuluj
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        data-testid="delete-product-confirm-button"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Usuń produkt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
