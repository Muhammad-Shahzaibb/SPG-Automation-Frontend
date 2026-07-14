"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface CompanyLogoProps {
  variant?: "full" | "mark";
  className?: string;
  showAppName?: boolean;
  centered?: boolean;
  size?: "sm" | "md";
}

export function CompanyLogo({
  variant = "full",
  className,
  showAppName = true,
  centered = false,
  size = "md",
}: CompanyLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Light theme → black logo; dark theme → white logo
  const src =
    mounted && resolvedTheme === "dark"
      ? "/muntq-logo-white.svg"
      : "/muntq-logo-black.svg";

  const logoHeight = size === "sm" ? "h-6" : "h-10";

  if (variant === "mark") {
    return (
      <Image
        src={src}
        alt={APP_NAME}
        width={40}
        height={40}
        className={cn("h-7 w-auto object-contain object-left", className)}
        priority
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        size === "sm" ? "gap-0.5" : "gap-1",
        centered && "items-center",
        className
      )}
    >
      <Image
        src={src}
        alt={APP_NAME}
        width={180}
        height={48}
        className={cn(
          "w-auto object-contain",
          logoHeight,
          centered ? "object-center" : "object-left"
        )}
        priority
      />
      {showAppName && (
        <p
          className={cn(
            "font-medium text-muted-foreground",
            size === "sm" ? "text-[10px] leading-tight" : "text-xs"
          )}
        >
          {APP_NAME}
        </p>
      )}
    </div>
  );
}
