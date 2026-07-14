import apiClient, { getRefreshToken } from "./api-client";
import type {
  AdminDashboardStats,
  CreateUserRequest,
  ExcelRequest,
  LoginRequest,
  ParseResponse,
  ResetPasswordRequest,
  TokenResponse,
  UpdateUserRequest,
  User,
  UserDashboardStats,
} from "@/types";

export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>("/auth/login", data).then((r) => r.data),

  logout: async () => {
    const refresh_token = getRefreshToken();
    if (!refresh_token) return { detail: "Logged out" };
    return apiClient
      .post<{ detail: string }>("/auth/logout", { refresh_token })
      .then((r) => r.data);
  },

  refresh: (refresh_token: string) =>
    apiClient
      .post<TokenResponse>("/auth/refresh", { refresh_token })
      .then((r) => r.data),

  me: () => apiClient.get<User>("/auth/me").then((r) => r.data),
};

export const dashboardService = {
  getUserStats: () =>
    apiClient.get<UserDashboardStats>("/dashboard/user").then((r) => r.data),

  getAdminStats: () =>
    apiClient.get<AdminDashboardStats>("/dashboard/admin").then((r) => r.data),
};

export const extractService = {
  parse: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return apiClient
      .post<ParseResponse>("/extract/parse", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  downloadExcel: async (data: ExcelRequest) => {
    const response = await apiClient.post("/extract/excel", data, {
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] as string | undefined;
    let filename = data.filename ?? "Specifications_Combined.xlsx";
    if (disposition) {
      const match = /filename="?([^"]+)"?/.exec(disposition);
      if (match?.[1]) filename = match[1];
    }
    if (!filename.endsWith(".xlsx")) filename = `${filename}.xlsx`;

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const userService = {
  getUsers: () => apiClient.get<User[]>("/users").then((r) => r.data),

  getUser: (id: string) =>
    apiClient.get<User>(`/users/${id}`).then((r) => r.data),

  createUser: (data: CreateUserRequest) =>
    apiClient.post<User>("/users", data).then((r) => r.data),

  updateUser: (id: string, data: UpdateUserRequest) =>
    apiClient.patch<User>(`/users/${id}`, data).then((r) => r.data),

  deleteUser: (id: string) =>
    apiClient.delete<{ detail: string }>(`/users/${id}`).then((r) => r.data),

  activate: (id: string) =>
    apiClient.post<User>(`/users/${id}/activate`).then((r) => r.data),

  deactivate: (id: string) =>
    apiClient.post<User>(`/users/${id}/deactivate`).then((r) => r.data),

  setActive: (id: string, is_active: boolean) =>
    apiClient
      .patch<User>(`/users/${id}/active`, { is_active })
      .then((r) => r.data),

  resetPassword: (id: string, data: ResetPasswordRequest) =>
    apiClient
      .post<{ detail: string }>(`/users/${id}/reset-password`, data)
      .then((r) => r.data),
};
