import { apiClient } from "./client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/api";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/auth/login", data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/auth/register", data);
  return res.data;
}
