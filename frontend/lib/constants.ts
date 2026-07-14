export const APP_NAME = "Binaof Extractor";
export const COMPANY_NAME = "QBS Co Pvt Ltd";
export const COMPANY_TAGLINE = "Paper Specification Extractor";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "binaof_access_token",
  REFRESH_TOKEN: "binaof_refresh_token",
  USER: "binaof_user",
  THEME: "binaof_theme",
  SIDEBAR_COLLAPSED: "binaof_sidebar_collapsed",
} as const;

export const NAV_ITEMS: {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/process", label: "Extract Documents", icon: "FileUp" },
  {
    href: "/users",
    label: "User Management",
    icon: "Users",
    adminOnly: true,
  },
];
