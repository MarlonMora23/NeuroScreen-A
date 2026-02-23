/**
 * User Service
 * Servicio para manejar usuarios
 */

import { httpClient } from "./http-client";
import { API_ENDPOINTS } from "@/config/api";

export interface AppUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface UpdateUserRequest extends Partial<Omit<CreateUserRequest, "password">> {
  password?: string;
}

class UserService {
  async getUsers(): Promise<AppUser[]> {
    return httpClient.get<AppUser[]>(API_ENDPOINTS.USERS);
  }

  async getUser(id: string): Promise<AppUser> {
    return httpClient.get<AppUser>(API_ENDPOINTS.USER_BY_ID(id));
  }

  async createUser(data: CreateUserRequest): Promise<AppUser> {
    return httpClient.post<AppUser>(API_ENDPOINTS.USERS, data);
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<AppUser> {
    return httpClient.put<AppUser>(API_ENDPOINTS.USER_BY_ID(id), data);
  }

  async deleteUser(id: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.USER_BY_ID(id));
  }
}

export const userService = new UserService();
