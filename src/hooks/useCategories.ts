import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/api/categories";
import type { CreateCategoryRequest, UpdateCategoryRequest } from "@/types/api";

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => ["categories", "list"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: getCategories,
    staleTime: 300_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCategoryRequest) => updateCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
