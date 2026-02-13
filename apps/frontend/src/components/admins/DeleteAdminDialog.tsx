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

interface DeleteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteAdminDialog({
  open,
  onOpenChange,
  adminName,
  onConfirm,
  isDeleting,
}: DeleteAdminDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="delete-admin-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Usuń użytkownika</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Czy na pewno chcesz usunąć użytkownika{' '}
            <span className="font-semibold text-foreground">{adminName}</span>?
            <br />
            <br />
            Ta operacja jest nieodwracalna.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            data-testid="delete-admin-cancel-button"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            data-testid="delete-admin-confirm-button"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Usuń użytkownika
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
