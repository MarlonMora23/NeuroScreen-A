/**
 * Auth Service
 * Servicio para manejar autenticación con el backend
 */

import { httpClient } from "./http-client";
import { API_ENDPOINTS, TOKEN_KEY } from "@/config/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await httpClient.post<AuthResponse>(API_ENDPOINTS.AUTH_LOGIN, {
      email,
      password,
    });

    if (data.access_token) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
    }

    return data;
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post(API_ENDPOINTS.AUTH_LOGOUT);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async getCurrentUser(): Promise<CurrentUser> {
    return httpClient.get<CurrentUser>(API_ENDPOINTS.AUTH_ME);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const authService = new AuthService();
