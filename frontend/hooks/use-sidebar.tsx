"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

interface SidebarContextValue {
  open: boolean;
  mounted: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    // legacy key stored "collapsed=true"; invert to open
    if (stored !== null) {
      setOpenState(stored !== "true");
    }
    setMounted(true);
  }, []);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(!value));
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(!next));
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ open, mounted, toggle, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarState must be used within SidebarProvider");
  }
  return context;
}
