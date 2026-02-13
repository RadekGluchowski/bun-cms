import type { AdminUser } from '@/api/admins.api';
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
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    email?: string;
    password?: string;
    name: string;
    role: 'admin' | 'editor';
  }) => void;
  isLoading: boolean;
  admin?: AdminUser | null;
}

export function AdminFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  admin,
}: AdminFormDialogProps) {
  const isEditing = Boolean(admin);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'editor'>('editor');

  useEffect(() => {
    if (open) {
      if (admin) {
        setEmail(admin.email);
        setName(admin.name);
        setRole(admin.role);
        setPassword('');
      } else {
        setEmail('');
        setPassword('');
        setName('');
        setRole('editor');
      }
    }
  }, [open, admin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onSubmit({ name, role });
    } else {
      onSubmit({ email, password, name, role });
    }
  };

  const isValid = isEditing
    ? name.trim().length > 0
    : email.trim().length > 0 && password.length >= 6 && name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="admin-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edytuj użytkownika' : 'Dodaj użytkownika'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Zmień nazwę lub rolę użytkownika.'
              : 'Utwórz nowe konto w systemie CMS.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan@example.com"
                required
                data-testid="admin-form-email-input"
              />
            </div>
          )}

          {isEditing && (
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{admin?.email}</p>
            </div>
          )}

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="admin-password">Hasło</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 znaków"
                minLength={6}
                required
                data-testid="admin-form-password-input"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-name">Nazwa</Label>
            <Input
              id="admin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jan Kowalski"
              required
              data-testid="admin-form-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-role">Rola</Label>
            <select
              id="admin-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'editor')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              data-testid="admin-form-role-select"
            >
              <option value="editor">Redaktor</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isValid}
              data-testid="admin-form-submit-button"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Zapisz' : 'Utwórz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
