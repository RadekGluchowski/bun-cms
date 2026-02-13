import {
  type AdminListResponse,
  type CreateAdminRequest,
  type UpdateAdminRequest,
  adminsApi,
} from '@/api/admins.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const adminKeys = {
  all: ['admins'] as const,
  list: () => [...adminKeys.all, 'list'] as const,
};

export function useAdminsList() {
  return useQuery<AdminListResponse>({
    queryKey: adminKeys.list(),
    queryFn: () => adminsApi.list(),
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdminRequest) => adminsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.list() });
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminRequest }) =>
      adminsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.list() });
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.list() });
    },
  });
}
