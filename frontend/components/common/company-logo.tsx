import Image from "next/image";
import { cn } from "@/lib/utils";
import { APP_NAME, COMPANY_NAME } from "@/lib/constants";

interface CompanyLogoProps {
  variant?: "full" | "mark";
  className?: string;
  showAppName?: boolean;
  centered?: boolean;
}

export function CompanyLogo({
  variant = "full",
  className,
  showAppName = true,
  centered = false,
}: CompanyLogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src="/qbs_logo.svg"
        alt={COMPANY_NAME}
        width={40}
        height={13}
        className={cn("h-8 w-auto object-contain object-left", className)}
        priority
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        centered && "items-center",
        className
      )}
    >
      <Image
        src="/qbs_logo.svg"
        alt={COMPANY_NAME}
        width={160}
        height={52}
        className={cn(
          "h-10 w-auto object-contain",
          centered ? "object-center" : "object-left"
        )}
        priority
      />
      {showAppName && (
        <p className="text-xs font-medium text-muted-foreground">{APP_NAME}</p>
      )}
    </div>
  );
}
