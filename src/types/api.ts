// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = "Admin" | "Customer";

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: UserRole;
  expiresAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  children: CategoryDto[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
}

export type UpdateCategoryRequest = CreateCategoryRequest;

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductStatus = "Draft" | "Active" | "Archived";

export interface ProductAttributeDto {
  key: string;
  value: string;
}

export interface ProductImageDto {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  variantId?: string;
}

export interface ProductVariantDto {
  id: string;
  color?: string;
  size?: string;
  sku: string;
  priceOverride?: number;
  availableQuantity: number;
}

export interface ProductSummaryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  brand?: string;
  basePrice: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  images: ProductImageDto[];
}

export interface ProductDetailDto extends ProductSummaryDto {
  attributes: ProductAttributeDto[];
  variants: ProductVariantDto[];
}

export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  brand?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  categoryId: string;
  brand?: string;
  basePrice: number;
  attributes: ProductAttributeDto[];
}

export type UpdateProductRequest = CreateProductRequest;

export interface UpdateProductStatusRequest {
  status: ProductStatus;
}

// ─── Variants ─────────────────────────────────────────────────────────────────

export interface CreateVariantRequest {
  color?: string;
  size?: string;
  sku: string;
  priceOverride?: number;
  initialQuantity: number;
}

export interface UpdateVariantRequest {
  color?: string;
  size?: string;
  sku: string;
  priceOverride?: number;
}

// ─── Images ───────────────────────────────────────────────────────────────────

export interface AddImageRequest {
  url: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
  variantId?: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryDto {
  variantId: string;
  sku: string;
  color?: string;
  size?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface SetInventoryRequest {
  quantity: number;
}

export interface AdjustInventoryRequest {
  delta: number;
  reason?: string;
}

// ─── API Errors ───────────────────────────────────────────────────────────────

export interface ApiProblemDetails {
  type?: string;
  title: string;
  status: number;
  traceId?: string;
  errors?: Record<string, string[]>;
}
