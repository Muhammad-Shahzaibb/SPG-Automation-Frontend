export const APP_NAME = "MuntQ Parsing Engine";
export const COMPANY_NAME = "QBS Co Pvt Ltd";
export const COMPANY_TAGLINE = "Paper Specification Extractor";

// export const API_BASE_URL = "http://163.61.91.66:30527/api/v1";
export const API_BASE_URL = "http://localhost:8000/api/v1";
  // process.env.NEXT_PUBLIC_API_URL ?? "http://163.61.91.66:30527/api/v1";

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "muntq_access_token",
  REFRESH_TOKEN: "muntq_refresh_token",
  USER: "muntq_user",
  THEME: "muntq_theme",
  SIDEBAR_COLLAPSED: "muntq_sidebar_collapsed",
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