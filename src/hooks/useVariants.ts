import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createVariant,
  deleteVariant,
  getVariants,
  updateVariant,
} from "@/api/variants";
import type { CreateVariantRequest, UpdateVariantRequest } from "@/types/api";
import { productKeys } from "./useProducts";

export const variantKeys = {
  list: (productId: string) => ["variants", productId] as const,
};

export function useVariants(productId: string) {
  return useQuery({
    queryKey: variantKeys.list(productId),
    queryFn: () => getVariants(productId),
    enabled: !!productId,
  });
}

export function useCreateVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVariantRequest) => createVariant(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: variantKeys.list(productId) });
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}

export function useUpdateVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, data }: { variantId: string; data: UpdateVariantRequest }) =>
      updateVariant(productId, variantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: variantKeys.list(productId) });
    },
  });
}

export function useDeleteVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(productId, variantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: variantKeys.list(productId) });
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}
