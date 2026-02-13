import type { AdminUser } from '@/api/admins.api';
import { AdminFormDialog, DeleteAdminDialog } from '@/components/admins';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '@/components/ui';
import {
  useAdminsList,
  useCreateAdmin,
  useDeleteAdmin,
  useUpdateAdmin,
} from '@/hooks/useAdmins';
import { useAuthStore } from '@/stores/auth.store';
import { formatRelativeTime } from '@/utils/date.utils';
import { Edit, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

export function AdminsPage() {
  const { toast } = useToast();
  const currentAdmin = useAuthStore((state) => state.admin);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);

  const { data, isLoading, isError } = useAdminsList();
  const createMutation = useCreateAdmin();
  const updateMutation = useUpdateAdmin();
  const deleteMutation = useDeleteAdmin();

  const admins = data?.admins ?? [];

  const handleCreate = () => {
    setEditingAdmin(null);
    setIsFormOpen(true);
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: {
    email?: string;
    password?: string;
    name: string;
    role: 'admin' | 'editor';
  }) => {
    try {
      if (editingAdmin) {
        await updateMutation.mutateAsync({
          id: editingAdmin.id,
          data: { name: formData.name, role: formData.role },
        });
        toast({
          title: 'Użytkownik zaktualizowany',
          description: 'Zmiany zostały zapisane.',
          variant: 'success',
        });
      } else {
        await createMutation.mutateAsync({
          email: formData.email!,
          password: formData.password!,
          name: formData.name,
          role: formData.role,
        });
        toast({
          title: 'Użytkownik utworzony',
          description: 'Nowe konto zostało dodane.',
          variant: 'success',
        });
      }
      setIsFormOpen(false);
      setEditingAdmin(null);
    } catch {
      toast({
        title: 'Błąd operacji',
        description: 'Nie udało się wykonać operacji.',
        variant: 'error',
      });
    }
  };

  const handleDeleteClick = (admin: AdminUser) => {
    setDeletingAdmin(admin);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAdmin) return;
    try {
      await deleteMutation.mutateAsync(deletingAdmin.id);
      toast({
        title: 'Użytkownik usunięty',
        description: 'Konto zostało usunięte.',
        variant: 'success',
      });
      setDeletingAdmin(null);
    } catch {
      toast({
        title: 'Błąd operacji',
        description: 'Nie udało się usunąć użytkownika.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Użytkownicy' }]} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            data-testid="admins-page-title"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Użytkownicy
          </h1>
          <p className="text-muted-foreground">
            Zarządzaj kontami użytkowników systemu CMS
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="gap-2"
          data-testid="admins-add-button"
        >
          <Plus className="h-4 w-4" />
          Dodaj użytkownika
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-muted-foreground">
              Nie udało się załadować listy użytkowników.
            </div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Brak użytkowników</p>
              <p className="text-muted-foreground">
                Dodaj pierwszego użytkownika klikając przycisk powyżej.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Ostatnia aktualizacja
                  </TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin, index) => (
                  <TableRow
                    key={admin.id}
                    data-testid={`admins-table-row-${index}`}
                  >
                    <TableCell
                      className="font-medium"
                      data-testid={`admins-table-row-name-${index}`}
                    >
                      {admin.name}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-testid={`admins-table-row-email-${index}`}
                    >
                      {admin.email}
                    </TableCell>
                    <TableCell data-testid={`admins-table-row-role-${index}`}>
                      <Badge
                        variant={
                          admin.role === 'admin' ? 'default' : 'secondary'
                        }
                      >
                        {admin.role === 'admin'
                          ? 'Administrator'
                          : 'Redaktor'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatRelativeTime(admin.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          data-testid={`admins-table-row-edit-button-${index}`}
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(admin)}
                          title="Edytuj"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {admin.id !== currentAdmin?.id && (
                          <Button
                            data-testid={`admins-table-row-delete-button-${index}`}
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(admin)}
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

      <AdminFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingAdmin(null);
        }}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        admin={editingAdmin}
      />

      <DeleteAdminDialog
        open={Boolean(deletingAdmin)}
        onOpenChange={(open) => !open && setDeletingAdmin(null)}
        adminName={deletingAdmin?.name ?? ''}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
