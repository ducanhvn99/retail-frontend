import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adjustInventory, getInventory, setInventory } from "@/api/inventory";
import type { AdjustInventoryRequest, SetInventoryRequest } from "@/types/api";
import { variantKeys } from "./useVariants";

export const inventoryKeys = {
  list: (productId: string) => ["inventory", productId] as const,
};

export function useInventory(productId: string) {
  return useQuery({
    queryKey: inventoryKeys.list(productId),
    queryFn: () => getInventory(productId),
    enabled: !!productId,
  });
}

export function useSetInventory(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, data }: { variantId: string; data: SetInventoryRequest }) =>
      setInventory(variantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.list(productId) });
      qc.invalidateQueries({ queryKey: variantKeys.list(productId) });
    },
  });
}

export function useAdjustInventory(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, data }: { variantId: string; data: AdjustInventoryRequest }) =>
      adjustInventory(variantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.list(productId) });
      qc.invalidateQueries({ queryKey: variantKeys.list(productId) });
    },
  });
}
