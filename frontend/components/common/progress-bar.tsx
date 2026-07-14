"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  label,
  showValue = true,
  className,
  size = "md",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="font-medium tabular-nums">{clampedValue}%</span>
          )}
        </div>
      )}
      <Progress
        value={clampedValue}
        className={cn(
          size === "sm" && "h-1.5",
          size === "md" && "h-2",
          size === "lg" && "h-3"
        )}
      />
    </div>
  );
}
