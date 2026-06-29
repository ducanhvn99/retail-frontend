import { apiClient } from "./client";
import type {
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/types/api";

export async function getCategories(): Promise<CategoryDto[]> {
  const res = await apiClient.get<CategoryDto[]>("/api/categories");
  return res.data;
}

export async function getCategory(id: string): Promise<CategoryDto> {
  const res = await apiClient.get<CategoryDto>(`/api/categories/${id}`);
  return res.data;
}

export async function createCategory(data: CreateCategoryRequest): Promise<CategoryDto> {
  const res = await apiClient.post<CategoryDto>("/api/categories", data);
  return res.data;
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryRequest
): Promise<CategoryDto> {
  const res = await apiClient.put<CategoryDto>(`/api/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/api/categories/${id}`);
}
