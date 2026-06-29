import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a digit"),
  role: z.enum(["Admin", "Customer"]),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Category ─────────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(2000).optional(),
  parentId: z.string().uuid().optional().or(z.literal("")),
  sortOrder: z.coerce.number().min(0, "Must be non-negative").int(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// ─── Product ─────────────────────────────────────────────────────────────────

export const attributeSchema = z.object({
  key: z.string().min(1, "Key required").max(100),
  value: z.string().min(1, "Value required").max(500),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  categoryId: z.string().uuid("Category is required"),
  brand: z.string().max(100).optional(),
  basePrice: z.coerce.number().positive("Price must be greater than 0"),
  attributes: z.array(attributeSchema).default([]),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// ─── Variant ─────────────────────────────────────────────────────────────────

export const skuPattern = /^[A-Z0-9\-_]+$/;

export const variantSchema = z.object({
  color: z.string().max(50).optional(),
  size: z.string().max(20).optional(),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(100)
    .regex(skuPattern, "SKU must be uppercase letters, digits, hyphens, or underscores"),
  priceOverride: z.coerce
    .number()
    .positive("Must be > 0")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  initialQuantity: z.coerce.number().min(0, "Must be non-negative").int(),
});

export const updateVariantSchema = variantSchema.omit({ initialQuantity: true });

export type VariantFormValues = z.infer<typeof variantSchema>;
export type UpdateVariantFormValues = z.infer<typeof updateVariantSchema>;

// ─── Image ───────────────────────────────────────────────────────────────────

export const imageSchema = z.object({
  url: z.string().url("Must be a valid URL").max(1000),
  altText: z.string().max(200).optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.coerce.number().min(0).int().default(0),
  variantId: z.string().uuid().optional().or(z.literal("")),
});

export type ImageFormValues = z.infer<typeof imageSchema>;

// ─── Inventory ───────────────────────────────────────────────────────────────

export const setInventorySchema = z.object({
  quantity: z.coerce.number().min(0, "Must be non-negative").int(),
});

export const adjustInventorySchema = z.object({
  delta: z.coerce.number().int().refine((v) => v !== 0, "Delta must be non-zero"),
  reason: z.string().max(500).optional(),
});

export type SetInventoryFormValues = z.infer<typeof setInventorySchema>;
export type AdjustInventoryFormValues = z.infer<typeof adjustInventorySchema>;
