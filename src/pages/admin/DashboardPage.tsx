import { Package, Tag, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

export default function DashboardPage() {
  const { data: products } = useProducts({ pageSize: 1 });
  const { data: categories } = useCategories();

  const flatCount = (cats: typeof categories): number =>
    (cats ?? []).reduce((acc, c) => acc + 1 + flatCount(c.children), 0);

  const stats = [
    {
      label: "Total Products",
      value: products?.totalCount ?? "–",
      icon: Package,
      to: "/admin/products",
    },
    {
      label: "Categories",
      value: flatCount(categories),
      icon: Tag,
      to: "/admin/categories",
    },
    {
      label: "Active Products",
      value: "–",
      icon: BarChart3,
      to: "/admin/products",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{String(stat.value)}</p>
              <Button variant="link" className="mt-2 h-auto p-0 text-xs" asChild>
                <Link to={stat.to}>View all →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/admin/products/new">
                <Package className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/categories">
                <Tag className="mr-2 h-4 w-4" />
                Manage Categories
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
