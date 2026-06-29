import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { categorySchema, type CategoryFormValues } from "@/lib/schemas";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import type { CategoryDto } from "@/types/api";

type Mode = "create" | "edit" | null;

interface DialogState {
  mode: Mode;
  category?: CategoryDto;
  parentId?: string;
}

function CategoryNode({
  category,
  depth,
  onEdit,
  onDelete,
  onAdd,
  flatCategories,
}: {
  category: CategoryDto;
  depth: number;
  onEdit: (cat: CategoryDto) => void;
  onDelete: (cat: CategoryDto) => void;
  onAdd: (parentId: string) => void;
  flatCategories: { id: string; name: string }[];
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md p-2 hover:bg-muted/50"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button
          className="text-muted-foreground"
          onClick={() => setExpanded((p) => !p)}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="block h-4 w-4" />
          )}
        </button>
        <span className="flex-1 font-medium">{category.name}</span>
        <Badge variant={category.isActive ? "success" : "secondary"} className="text-xs">
          {category.isActive ? "Active" : "Inactive"}
        </Badge>
        <span className="text-xs text-muted-foreground">sort: {category.sortOrder}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdd(category.id)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(category)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {expanded &&
        category.children.map((child) => (
          <CategoryNode
            key={child.id}
            category={child}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            onAdd={onAdd}
            flatCategories={flatCategories}
          />
        ))}
    </div>
  );
}

function CategoryForm({
  defaultValues,
  flatCategories,
  onSubmit,
  apiError,
}: {
  defaultValues?: Partial<CategoryFormValues>;
  flatCategories: { id: string; name: string }[];
  onSubmit: (values: CategoryFormValues) => void;
  apiError: Error | null;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues ?? { sortOrder: 0 },
  });

  return (
    <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ApiErrorAlert error={apiError} />

      <div className="space-y-1">
        <Label>Name *</Label>
        <Input {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea rows={2} {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Parent category</Label>
          <Select
            defaultValue={defaultValues?.parentId ?? "none"}
            onValueChange={(v) => setValue("parentId", v === "none" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="None (root)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (root)</SelectItem>
              {flatCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Sort order</Label>
          <Input type="number" min={0} {...register("sortOrder")} />
          {errors.sortOrder && (
            <p className="text-sm text-destructive">{errors.sortOrder.message}</p>
          )}
        </div>
      </div>
    </form>
  );
}

export default function CategoryPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const [dialog, setDialog] = useState<DialogState>({ mode: null });
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [apiError, setApiError] = useState<Error | null>(null);

  const flatCategories: { id: string; name: string }[] = [];
  const flatten = (cats: CategoryDto[]) => {
    cats.forEach((c) => {
      flatCategories.push({ id: c.id, name: c.name });
      flatten(c.children);
    });
  };
  flatten(categories);

  const updateMutation = useUpdateCategory(dialog.category?.id ?? "");

  const openCreate = (parentId?: string) =>
    setDialog({ mode: "create", parentId });
  const openEdit = (cat: CategoryDto) =>
    setDialog({ mode: "edit", category: cat });
  const closeDialog = () => {
    setDialog({ mode: null });
    setApiError(null);
  };

  const handleSubmit = async (values: CategoryFormValues) => {
    setApiError(null);
    const payload = {
      ...values,
      parentId: values.parentId || undefined,
      description: values.description || undefined,
    };
    try {
      if (dialog.mode === "create") {
        await createMutation.mutateAsync({
          ...payload,
          parentId: dialog.parentId ?? payload.parentId,
        });
        toast.success("Category created");
      } else if (dialog.mode === "edit") {
        await updateMutation.mutateAsync(payload);
        toast.success("Category updated");
      }
      closeDialog();
    } catch (err) {
      if (err instanceof Error) setApiError(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Category deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.title
          : "Cannot delete — may have sub-categories or linked products"
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">{flatCategories.length} categories</p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <p className="p-4 text-muted-foreground">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            No categories yet. Create one above.
          </p>
        ) : (
          <div className="py-2">
            {categories.map((cat) => (
              <CategoryNode
                key={cat.id}
                category={cat}
                depth={0}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onAdd={openCreate}
                flatCategories={flatCategories}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialog.mode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === "create" ? "New category" : "Edit category"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            defaultValues={
              dialog.mode === "edit" && dialog.category
                ? {
                    name: dialog.category.name,
                    description: dialog.category.description,
                    parentId: dialog.category.parentId,
                    sortOrder: dialog.category.sortOrder,
                  }
                : { parentId: dialog.parentId, sortOrder: 0 }
            }
            flatCategories={flatCategories.filter((c) => c.id !== dialog.category?.id)}
            onSubmit={handleSubmit}
            apiError={apiError}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              form="category-form"
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.name}</strong>? This fails if it has sub-categories or
            linked products.
          </p>
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
