import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { registerSchema, type RegisterFormValues } from "@/lib/schemas";
import { register as registerApi } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "Customer" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError(null);
    try {
      const res = await registerApi(values);
      storeLogin(res.token, { email: res.email, role: res.role, expiresAt: res.expiresAt });
      toast.success("Account created!");
      navigate(res.role === "Admin" ? "/admin" : "/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setApiError(err);
      else toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Fill in your details to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <ApiErrorAlert error={apiError} />

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Min 8 characters, one uppercase letter, one digit
              </p>
            </div>

            <div className="space-y-1">
              <Label>Account type</Label>
              <Select
                defaultValue="Customer"
                onValueChange={(v) => setValue("role", v as "Admin" | "Customer")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
