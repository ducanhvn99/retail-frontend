import { apiClient } from "./client";
import type { CreateVariantRequest, ProductVariantDto, UpdateVariantRequest } from "@/types/api";

export async function getVariants(productId: string): Promise<ProductVariantDto[]> {
  const res = await apiClient.get<ProductVariantDto[]>(`/api/products/${productId}/variants`);
  return res.data;
}

export async function createVariant(
  productId: string,
  data: CreateVariantRequest
): Promise<ProductVariantDto> {
  const res = await apiClient.post<ProductVariantDto>(
    `/api/products/${productId}/variants`,
    data
  );
  return res.data;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  data: UpdateVariantRequest
): Promise<ProductVariantDto> {
  const res = await apiClient.put<ProductVariantDto>(
    `/api/products/${productId}/variants/${variantId}`,
    data
  );
  return res.data;
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  await apiClient.delete(`/api/products/${productId}/variants/${variantId}`);
}
