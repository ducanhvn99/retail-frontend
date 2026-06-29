import { apiClient } from "./client";
import type { AdjustInventoryRequest, InventoryDto, SetInventoryRequest } from "@/types/api";

export async function getInventory(productId: string): Promise<InventoryDto[]> {
  const res = await apiClient.get<InventoryDto[]>(`/api/products/${productId}/inventory`);
  return res.data;
}

export async function setInventory(
  variantId: string,
  data: SetInventoryRequest
): Promise<InventoryDto> {
  const res = await apiClient.put<InventoryDto>(`/api/inventory/${variantId}`, data);
  return res.data;
}

export async function adjustInventory(
  variantId: string,
  data: AdjustInventoryRequest
): Promise<InventoryDto> {
  const res = await apiClient.patch<InventoryDto>(`/api/inventory/${variantId}/adjust`, data);
  return res.data;
}
