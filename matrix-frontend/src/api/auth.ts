import { useMutation } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface LoginCredentials {
  email: string;
  password?: string; // Optional because UI might not have password initially but for login it's required
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

const loginFn = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials,
  );
  return response.data;
};

export const useLogin = () => {
  return useMutation({
    mutationFn: loginFn,
  });
};

export const logout = () => {
  localStorage.removeItem("matrix_token");
};
