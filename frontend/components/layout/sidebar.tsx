"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileUp,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useSidebarState } from "@/hooks/use-sidebar";
import { CompanyLogo } from "@/components/common/company-logo";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const iconMap = {
  LayoutDashboard,
  FileUp,
  Users,
};

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();
  const { collapsed, toggle, mounted } = useSidebarState();

  if (!mounted) return null;

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="sticky top-0 flex h-screen flex-col border-r border-border bg-secondary shadow-sm"
      >
        <div className="flex h-[4.5rem] items-center border-b border-border px-3">
          <Link href="/dashboard" className="flex min-w-0 items-center">
            {collapsed ? (
              <CompanyLogo variant="mark" className="mx-auto" />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 px-1"
                >
                  <CompanyLogo showAppName />
                </motion.div>
              </AnimatePresence>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = pathname.startsWith(item.href);

            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:bg-background hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </nav>

        <div className="space-y-1 border-t border-border p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-muted-foreground"
                  onClick={() => logout()}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={() => logout()}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn("w-full", collapsed ? "justify-center" : "justify-end")}
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
