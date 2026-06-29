import axios, { AxiosError } from "axios";
import type { ApiProblemDetails } from "@/types/api";

export class ApiError extends Error {
  status: number;
  title: string;
  errors?: Record<string, string[]>;

  constructor(problem: ApiProblemDetails) {
    super(problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.title = problem.title;
    this.errors = problem.errors;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage (set by authStore)
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem("auth-storage");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: { token?: string } };
      const token = parsed.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore malformed storage
    }
  }
  return config;
});

// Normalise error responses to ApiError
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiProblemDetails>) => {
    const data = err.response?.data;
    if (data && typeof data === "object" && "title" in data) {
      throw new ApiError(data as ApiProblemDetails);
    }
    throw new ApiError({
      title: err.message || "An unexpected error occurred",
      status: err.response?.status ?? 0,
    });
  }
);
