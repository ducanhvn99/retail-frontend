import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { productSchema, type ProductFormValues } from "@/lib/schemas";
import { useProduct, useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useVariants, useCreateVariant, useDeleteVariant } from "@/hooks/useVariants";
import { useInventory, useAdjustInventory } from "@/hooks/useInventory";
import { addImage, deleteImage } from "@/api/images";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/utils";
import type { ProductVariantDto, InventoryDto, ProductImageDto } from "@/types/api";

// ─── Variant Panel ────────────────────────────────────────────────────────────

function VariantsPanel({ productId }: { productId: string }) {
  const { data: variants = [], isLoading } = useVariants(productId);
  const { data: inventory = [] } = useInventory(productId);
  const createVariant = useCreateVariant(productId);
  const deleteVariantMutation = useDeleteVariant(productId);
  const adjustInventoryMutation = useAdjustInventory(productId);

  const [showForm, setShowForm] = useState(false);
  const [newVariant, setNewVariant] = useState({
    sku: "",
    color: "",
    size: "",
    priceOverride: "",
    initialQuantity: 0,
  });
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");

  const getInv = (variantId: string): InventoryDto | undefined =>
    inventory.find((inv) => inv.variantId === variantId);

  const handleCreate = async () => {
    try {
      await createVariant.mutateAsync({
        sku: newVariant.sku.toUpperCase(),
        color: newVariant.color || undefined,
        size: newVariant.size || undefined,
        priceOverride: newVariant.priceOverride ? Number(newVariant.priceOverride) : undefined,
        initialQuantity: Number(newVariant.initialQuantity),
      });
      toast.success("Variant added");
      setNewVariant({ sku: "", color: "", size: "", priceOverride: "", initialQuantity: 0 });
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.title : "Failed to add variant");
    }
  };

  const handleDelete = async (variantId: string) => {
    try {
      await deleteVariantMutation.mutateAsync(variantId);
      toast.success("Variant removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.title : "Failed to remove variant");
    }
  };

  const handleAdjust = async (variantId: string) => {
    try {
      await adjustInventoryMutation.mutateAsync({
        variantId,
        data: { delta: adjustDelta, reason: adjustReason || undefined },
      });
      toast.success("Inventory adjusted");
      setAdjusting(null);
      setAdjustDelta(0);
      setAdjustReason("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.title : "Failed to adjust inventory");
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading variants…</p>;

  return (
    <div className="space-y-4">
      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No variants yet. Add one below.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {variants.map((v: ProductVariantDto) => {
            const inv = getInv(v.id);
            return (
              <div key={v.id} className="flex items-center gap-4 p-3">
                <div className="flex-1">
                  <p className="font-mono text-sm font-medium">{v.sku}</p>
                  <p className="text-xs text-muted-foreground">
                    {[v.color, v.size].filter(Boolean).join(" / ")}
                    {v.priceOverride !== undefined && ` · ${formatPrice(v.priceOverride)}`}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={inv && inv.availableQuantity > 0 ? "success" : "secondary"}>
                    {inv ? `${inv.availableQuantity} avail.` : "–"}
                  </Badge>
                </div>
                {adjusting === v.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      placeholder="±delta"
                      value={adjustDelta}
                      onChange={(e) => setAdjustDelta(Number(e.target.value))}
                    />
                    <Input
                      className="w-32"
                      placeholder="Reason"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                    />
                    <Button size="sm" onClick={() => handleAdjust(v.id)} disabled={adjustDelta === 0}>
                      Apply
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAdjusting(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAdjusting(v.id)}
                  >
                    Adjust stock
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(v.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <div className="rounded-md border p-4 space-y-3">
          <p className="font-medium text-sm">New variant</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">SKU *</Label>
              <Input
                placeholder="SHIRT-BLK-M"
                value={newVariant.sku}
                onChange={(e) => setNewVariant((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input
                placeholder="Black"
                value={newVariant.color}
                onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Size</Label>
              <Input
                placeholder="M"
                value={newVariant.size}
                onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price override</Label>
              <Input
                type="number"
                placeholder="29.99"
                value={newVariant.priceOverride}
                onChange={(e) => setNewVariant((p) => ({ ...p, priceOverride: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Initial quantity *</Label>
              <Input
                type="number"
                min={0}
                value={newVariant.initialQuantity}
                onChange={(e) =>
                  setNewVariant((p) => ({ ...p, initialQuantity: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={!newVariant.sku || createVariant.isPending}>
              {createVariant.isPending ? "Adding…" : "Add variant"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add variant
        </Button>
      )}
    </div>
  );
}

// ─── Images Panel ─────────────────────────────────────────────────────────────

function ImagesPanel({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const [images, setImages] = useState<ProductImageDto[]>([]);
  const [form, setForm] = useState({ url: "", altText: "", isPrimary: false });
  const [loading, setLoading] = useState(false);

  // Pull images from product cache on mount
  useEffect(() => {
    const cached = qc.getQueryData<{ images: ProductImageDto[] }>(productKeys.detail(productId));
    if (cached) setImages(cached.images ?? []);
  }, [productId, qc]);

  const handleAdd = async () => {
    if (!form.url) return;
    setLoading(true);
    try {
      const newImg = await addImage(productId, form);
      setImages((prev) => [...prev, newImg]);
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      setForm({ url: "", altText: "", isPrimary: false });
      toast.success("Image added");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.title : "Failed to add image");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await deleteImage(productId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      toast.success("Image removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.title : "Failed to remove image");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Images are linked by URL. Paste any publicly accessible image URL.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded border">
            <img
              src={img.url}
              alt={img.altText ?? ""}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Error";
              }}
            />
            {img.isPrimary && (
              <Badge className="absolute left-1 top-1 text-xs">Primary</Badge>
            )}
            <button
              onClick={() => handleDelete(img.id)}
              className="absolute right-1 top-1 hidden rounded bg-destructive p-1 text-white group-hover:block"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <p className="font-medium text-sm">Add image</p>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Image URL *</Label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alt text</Label>
            <Input
              placeholder="Product image"
              value={form.altText}
              onChange={(e) => setForm((p) => ({ ...p, altText: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))}
            />
            Set as primary image
          </label>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={!form.url || loading}>
          {loading ? "Adding…" : "Add image"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<Error | null>(null);

  const { data: existing, isLoading: loadingProduct } = useProduct(id ?? "");
  const { data: categories } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(id ?? "");

  const flatCategories: { id: string; name: string }[] = [];
  const flatten = (cats: typeof categories) => {
    cats?.forEach((c) => {
      flatCategories.push({ id: c.id, name: c.name });
      flatten(c.children);
    });
  };
  flatten(categories);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { attributes: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "attributes" });

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description ?? "",
        categoryId: existing.categoryId,
        brand: existing.brand ?? "",
        basePrice: existing.basePrice,
        attributes: existing.attributes,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: ProductFormValues) => {
    setApiError(null);
    const payload = {
      ...values,
      description: values.description || undefined,
      brand: values.brand || undefined,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success("Product updated");
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success("Product created");
        navigate(`/admin/products/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      if (err instanceof Error) setApiError(err);
      toast.error("Save failed");
    }
  };

  if (isEdit && loadingProduct) {
    return <p className="text-muted-foreground">Loading product…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/products">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Products
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? "Edit product" : "New product"}</h1>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {isEdit && <TabsTrigger value="variants">Variants</TabsTrigger>}
          {isEdit && <TabsTrigger value="images">Images</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <ApiErrorAlert error={apiError} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea rows={3} {...register("description")} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Category *</Label>
                    <Select
                      value={existing?.categoryId}
                      onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {flatCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && (
                      <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Brand</Label>
                    <Input {...register("brand")} />
                  </div>

                  <div className="space-y-1">
                    <Label>Base price (USD) *</Label>
                    <Input type="number" step="0.01" {...register("basePrice")} />
                    {errors.basePrice && (
                      <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Attributes</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: "", value: "" })}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">No attributes yet.</p>
                )}
                {fields.map((field, i) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Key (e.g. Material)" {...register(`attributes.${i}.key`)} />
                      {errors.attributes?.[i]?.key && (
                        <p className="text-xs text-destructive">
                          {errors.attributes[i]?.key?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Value (e.g. Cotton)" {...register(`attributes.${i}.value`)} />
                      {errors.attributes?.[i]?.value && (
                        <p className="text-xs text-destructive">
                          {errors.attributes[i]?.value?.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/admin/products">Cancel</Link>
              </Button>
            </div>
          </form>
        </TabsContent>

        {isEdit && (
          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Variants & Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <VariantsPanel productId={id!} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isEdit && (
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <ImagesPanel productId={id!} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
