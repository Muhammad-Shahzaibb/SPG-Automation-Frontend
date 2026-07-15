export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  role?: UserRole;
}

export interface ResetPasswordRequest {
  new_password: string;
}

export interface SetActiveRequest {
  is_active: boolean;
}

export interface ParamValues {
  Min: string;
  Tar: string;
  Max: string;
  Unit: string;
}

export interface ParseRecord {
  file: string;
  SpecNo?: string;
  Client?: string;
  Quality?: string;
  Grade?: string;
  MatCode?: string;
  Color?: string;
  Ply?: string;
  params: Record<string, ParamValues>;
  [key: string]: unknown;
}

export interface ParseError {
  file: string;
  message: string;
}

export interface ParseResponse {
  run_id: string;
  files_total: number;
  files_ok: number;
  files_failed: number;
  columns: string[];
  errors: ParseError[];
  records: ParseRecord[];
}

export interface ExcelRequest {
  run_id: string;
  selected_columns: string[];
  filename?: string;
}

export interface PreviewRequest {
  run_id: string;
  selected_columns: string[];
}

export interface PreviewResponse {
  run_id: string;
  selected_columns: string[];
  total_rows: number;
  rows: ParseRecord[];
}

export interface UserDashboardStats {
  total_runs: number;
  files_processed: number;
  files_ok: number;
  files_failed: number;
  successful_runs: number;
  unsuccessful_runs: number;
  excel_downloads: number;
  last_run: string | null;
}

export interface AdminUserActivity {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  total_runs: number;
  files_processed: number;
  successful_runs: number;
  unsuccessful_runs: number;
  excel_downloads: number;
  last_run_at: string | null;
}

export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  total_runs: number;
  excel_runs: number;
  successful_runs: number;
  unsuccessful_runs: number;
  files_processed: number;
  users: AdminUserActivity[];
}

export interface ApiErrorDetail {
  detail: string | Array<{ msg: string; loc?: unknown[] }> | Record<string, unknown>;
}
