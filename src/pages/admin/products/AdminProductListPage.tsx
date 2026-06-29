import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useProducts, useDeleteProduct, useUpdateProductStatus } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/api/client";
import { formatPrice, formatDate } from "@/lib/utils";
import type { ProductStatus, ProductSummaryDto } from "@/types/api";

const STATUS_VARIANTS: Record<ProductStatus, "success" | "warning" | "secondary"> = {
  Active: "success",
  Draft: "warning",
  Archived: "secondary",
};

const STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  Draft: ["Active"],
  Active: ["Archived"],
  Archived: ["Draft"],
};

export default function AdminProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [deleteTarget, setDeleteTarget] = useState<ProductSummaryDto | null>(null);

  const params = {
    page: Number(searchParams.get("page") ?? 1),
    pageSize: 15,
    search: searchParams.get("search") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    status: (searchParams.get("status") as ProductStatus) ?? undefined,
    sortBy: "createdAt",
    sortDir: "desc" as const,
  };

  const { data, isLoading } = useProducts(params);
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteProduct();

  const flatCategories: { id: string; name: string }[] = [];
  const flatten = (cats: typeof categories) => {
    cats?.forEach((c) => {
      flatCategories.push({ id: c.id, name: c.name });
      flatten(c.children);
    });
  };
  flatten(categories);

  const setParam = (key: string, value: string | undefined) => {
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
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("search", search || undefined);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Product deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.title : "Failed to delete product");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">{data?.totalCount ?? 0} total</p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search…"
              className="pl-9 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" variant="outline">Search</Button>
        </form>

        <Select
          value={params.status ?? "all"}
          onValueChange={(v) => setParam("status", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>

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
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onDelete={() => setDeleteTarget(product)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasPreviousPage}
            onClick={() => setParam("page", String(params.page - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {data.page} / {data.totalPages}
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

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all its
              variants and images. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductRow({
  product,
  onDelete,
}: {
  product: ProductSummaryDto;
  onDelete: () => void;
}) {
  const updateStatus = useUpdateProductStatus(product.id);
  const transitions = STATUS_TRANSITIONS[product.status];

  const handleStatusChange = async (status: ProductStatus) => {
    try {
      await updateStatus.mutateAsync({ status });
      toast.success(`Status changed to ${status}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.title : "Failed to update status");
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt=""
              className="h-10 w-10 rounded object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="h-10 w-10 rounded bg-muted" />
          )}
          <div>
            <p className="font-medium">{product.name}</p>
            {product.brand && (
              <p className="text-xs text-muted-foreground">{product.brand}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{product.categoryName}</TableCell>
      <TableCell>{formatPrice(product.basePrice)}</TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANTS[product.status]}>{product.status}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(product.createdAt)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {transitions.map((status) => (
            <Button
              key={status}
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={updateStatus.isPending}
              onClick={() => handleStatusChange(status)}
            >
              → {status}
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link to={`/admin/products/${product.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
