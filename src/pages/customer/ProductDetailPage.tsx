import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { ProductVariantDto } from "@/types/api";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id!);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Product not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/">Back to products</Link>
        </Button>
      </div>
    );
  }

  const images = product.images.sort((a, b) => a.sortOrder - b.sortOrder);
  const displayImage = images[selectedImage];
  const effectivePrice =
    selectedVariant?.priceOverride !== undefined
      ? selectedVariant.priceOverride
      : product.basePrice;

  // Group variants by color
  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))];
  const [selectedColor, setSelectedColor] = useState<string | undefined>(colors[0]);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizes[0]);

  const matchingVariant =
    product.variants.find(
      (v) =>
        (colors.length === 0 || v.color === selectedColor) &&
        (sizes.length === 0 || v.size === selectedSize)
    ) ?? null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to products
        </Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            {displayImage ? (
              <img
                src={displayImage.url}
                alt={displayImage.altText ?? product.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/600x600?text=No+Image";
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                    i === selectedImage ? "border-primary" : "border-transparent"
                  }`}
                  onClick={() => setSelectedImage(i)}
                >
                  <img
                    src={img.url}
                    alt={img.altText ?? ""}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.brand && (
            <p className="text-sm uppercase tracking-wide text-muted-foreground">{product.brand}</p>
          )}
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-semibold">{formatPrice(effectivePrice)}</p>
          <Badge variant="outline">{product.categoryName}</Badge>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {/* Variant selectors */}
          {colors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Color: {selectedColor}</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color ?? undefined);
                      setSelectedVariant(null);
                    }}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selectedColor === color
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const available = product.variants.find(
                    (v) => v.size === size && (colors.length === 0 || v.color === selectedColor)
                  );
                  return (
                    <button
                      key={size}
                      disabled={!available || available.availableQuantity === 0}
                      onClick={() => {
                        setSelectedSize(size ?? undefined);
                        setSelectedVariant(available ?? null);
                      }}
                      className={`rounded border px-3 py-1 text-sm transition-colors disabled:opacity-40 ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock info */}
          {matchingVariant && (
            <p className="text-sm text-muted-foreground">
              {matchingVariant.availableQuantity > 0
                ? `${matchingVariant.availableQuantity} in stock`
                : "Out of stock"}
            </p>
          )}

          {/* Attributes */}
          {product.attributes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium">Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {product.attributes.map((attr) => (
                    <div key={attr.key}>
                      <span className="text-muted-foreground">{attr.key}: </span>
                      <span>{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
