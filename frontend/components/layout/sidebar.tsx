"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileUp,
  Users,
  LogOut,
  PanelLeftClose,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useSidebarState } from "@/hooks/use-sidebar";
import { CompanyLogo } from "@/components/common/company-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH = 260;

const iconMap = {
  LayoutDashboard,
  FileUp,
  Users,
};

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();
  const { open, toggle, mounted } = useSidebarState();

  if (!mounted) {
    return (
      <aside
        style={{ width: SIDEBAR_WIDTH }}
        className="sticky top-0 h-screen shrink-0 border-r border-border bg-secondary"
      />
    );
  }

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="sticky top-0 z-30 flex h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-secondary shadow-sm"
          style={{ minWidth: 0 }}
        >
          <div
            className="flex h-screen w-[260px] flex-col"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-3">
              <Link href="/dashboard" className="min-w-0 flex-1">
                <CompanyLogo showAppName size="sm" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={toggle}
                aria-label="Close sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/70 hover:bg-background hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border p-3">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground"
                onClick={() => logout()}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
