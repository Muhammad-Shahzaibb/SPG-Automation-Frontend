import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  active: boolean;
  className?: string;
}

export function StatusBadge({ active, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={active ? "success" : "secondary"}
      className={cn("capitalize", className)}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
