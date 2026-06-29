import { useSearchParams } from "react-router-dom";
import { useState, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import type { ProductSummaryDto } from "@/types/api";

function ProductCard({ product }: { product: ProductSummaryDto }) {
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  return (
    <Link to={`/products/${product.id}`} className="group">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.altText ?? product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/400x400?text=No+Image";
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
        </div>
        <CardContent className="p-4">
          {product.brand && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.brand}</p>
          )}
          <h3 className="mt-1 line-clamp-2 font-medium group-hover:text-primary">{product.name}</h3>
          <p className="mt-2 font-semibold">{formatPrice(product.basePrice)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{product.categoryName}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  const params = {
    page: Number(searchParams.get("page") ?? 1),
    pageSize: 12,
    search: searchParams.get("search") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    sortBy: searchParams.get("sortBy") ?? "createdAt",
    sortDir: (searchParams.get("sortDir") as "asc" | "desc") ?? "desc",
    status: "Active" as const,
  };

  const { data, isLoading, isError } = useProducts(params);
  const { data: categories } = useCategories();

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
          next.set("page", "1");
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("search", searchInput || undefined);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const hasFilters =
    params.search || params.categoryId || params.brand || params.minPrice || params.maxPrice;

  // Flatten categories for select
  const flatCategories: { id: string; name: string }[] = [];
  const flatten = (cats: typeof categories) => {
    cats?.forEach((c) => {
      flatCategories.push({ id: c.id, name: c.name });
      flatten(c.children);
    });
  };
  flatten(categories);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">Browse our collection</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              className="pl-9 w-60"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>

        <Select
          value={params.categoryId ?? "all"}
          onValueChange={(v) => setParam("categoryId", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {flatCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={`${params.sortBy}-${params.sortDir}`}
          onValueChange={(v) => {
            const [by, dir] = v.split("-");
            setParam("sortBy", by);
            setParam("sortDir", dir);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest</SelectItem>
            <SelectItem value="createdAt-asc">Oldest</SelectItem>
            <SelectItem value="basePrice-asc">Price: Low to High</SelectItem>
            <SelectItem value="basePrice-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Input
            placeholder="Min $"
            type="number"
            className="w-24"
            value={searchParams.get("minPrice") ?? ""}
            onChange={(e) => setParam("minPrice", e.target.value || undefined)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            placeholder="Max $"
            type="number"
            className="w-24"
            value={searchParams.get("maxPrice") ?? ""}
            onChange={(e) => setParam("maxPrice", e.target.value || undefined)}
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {params.search && (
            <Badge variant="secondary">
              Search: {params.search}
              <button
                className="ml-1 hover:text-destructive"
                onClick={() => {
                  setSearchInput("");
                  setParam("search", undefined);
                }}
              >
                ×
              </button>
            </Badge>
          )}
          {params.categoryId && (
            <Badge variant="secondary">
              {flatCategories.find((c) => c.id === params.categoryId)?.name ?? "Category"}
              <button className="ml-1 hover:text-destructive" onClick={() => setParam("categoryId", undefined)}>×</button>
            </Badge>
          )}
        </div>
      )}

      {/* Grid */}
      {isError ? (
        <div className="rounded-lg border border-destructive p-8 text-center text-destructive">
          Failed to load products. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <SlidersHorizontal className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-muted-foreground">Try adjusting your filters</p>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasPreviousPage}
                onClick={() => setParam("page", String(params.page - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasNextPage}
                onClick={() => setParam("page", String(params.page + 1))}
              >
                Next
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {data?.totalCount} product{data?.totalCount !== 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}
