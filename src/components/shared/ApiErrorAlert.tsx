import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiError } from "@/api/client";

interface Props {
  error: ApiError | Error | null;
}

export function ApiErrorAlert({ error }: Props) {
  if (!error) return null;

  const apiError = error as ApiError;
  const fieldErrors = apiError.errors
    ? Object.values(apiError.errors).flat()
    : [];

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{apiError.title ?? error.message}</AlertTitle>
      {fieldErrors.length > 0 && (
        <AlertDescription>
          <ul className="mt-1 list-disc pl-4">
            {fieldErrors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </AlertDescription>
      )}
    </Alert>
  );
}
