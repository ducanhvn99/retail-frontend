import { apiClient } from "./client";
import type { AddImageRequest, ProductImageDto } from "@/types/api";

export async function addImage(
  productId: string,
  data: AddImageRequest
): Promise<ProductImageDto> {
  const res = await apiClient.post<ProductImageDto>(`/api/products/${productId}/images`, data);
  return res.data;
}

export async function deleteImage(productId: string, imageId: string): Promise<void> {
  await apiClient.delete(`/api/products/${productId}/images/${imageId}`);
}
