import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
  updateProductStatus,
} from "@/api/products";
import type {
  CreateProductRequest,
  ProductQueryParams,
  UpdateProductRequest,
  UpdateProductStatusRequest,
} from "@/types/api";

export const productKeys = {
  all: ["products"] as const,
  list: (params: ProductQueryParams) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};

export function useProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    staleTime: 120_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    staleTime: 120_000,
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProductRequest) => updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProductStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProductStatusRequest) => updateProductStatus(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}
