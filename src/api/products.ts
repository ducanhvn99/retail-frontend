import { apiClient } from "./client";
import type {
  CreateProductRequest,
  PagedResult,
  ProductDetailDto,
  ProductQueryParams,
  ProductSummaryDto,
  UpdateProductRequest,
  UpdateProductStatusRequest,
} from "@/types/api";

export async function getProducts(
  params: ProductQueryParams = {}
): Promise<PagedResult<ProductSummaryDto>> {
  const res = await apiClient.get<PagedResult<ProductSummaryDto>>("/api/products", { params });
  return res.data;
}

export async function getProduct(id: string): Promise<ProductDetailDto> {
  const res = await apiClient.get<ProductDetailDto>(`/api/products/${id}`);
  return res.data;
}

export async function createProduct(data: CreateProductRequest): Promise<ProductDetailDto> {
  const res = await apiClient.post<ProductDetailDto>("/api/products", data);
  return res.data;
}

export async function updateProduct(
  id: string,
  data: UpdateProductRequest
): Promise<ProductDetailDto> {
  const res = await apiClient.put<ProductDetailDto>(`/api/products/${id}`, data);
  return res.data;
}

export async function updateProductStatus(
  id: string,
  data: UpdateProductStatusRequest
): Promise<void> {
  await apiClient.patch(`/api/products/${id}/status`, data);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/api/products/${id}`);
}
