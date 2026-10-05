"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotebookRunTimerProps {
  runId: string;
  createdAt: number; // Date.now() timestamp
  onExpired?: () => void;
  className?: string;
}

const RUN_LIFETIME_MS = 60 * 60 * 1000; // 1 hour

export function NotebookRunTimer({
  runId,
  createdAt,
  onExpired,
  className,
}: NotebookRunTimerProps) {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    return Math.max(0, RUN_LIFETIME_MS - (Date.now() - createdAt));
  });

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, RUN_LIFETIME_MS - (Date.now() - createdAt));
      setTimeLeftMs(remaining);
      if (remaining === 0 && onExpired) {
        onExpired();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [createdAt, onExpired]);

  const minutesLeft = Math.ceil(timeLeftMs / (60 * 1000));
  const isExpiringSoon = minutesLeft <= 15 && minutesLeft > 0;
  const isExpired = timeLeftMs <= 0;

  if (isExpired) {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive",
          className
        )}
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <div>
          <span className="font-semibold">Run Expired:</span> This session (Run ID: {runId.slice(0, 8)}...) has exceeded the 1-hour retention window. The backend may have purged cached rows. Please upload your files again.
        </div>
      </div>
    );
  }

  if (isExpiringSoon) {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300",
          className
        )}
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <span className="font-semibold">Session Expiring Soon:</span> This run expires in ~{minutesLeft} minute{minutesLeft === 1 ? "" : "s"}. Please finalize row exclusions and download your consolidated Excel before it expires.
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50/70 dark:bg-teal-950/40 px-3 py-1 text-xs text-teal-800 dark:text-teal-200",
        className
      )}
    >
      <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
      <span>
        Session active <span className="opacity-70">(expires in ~{minutesLeft}m)</span>
      </span>
    </div>
  );
}
