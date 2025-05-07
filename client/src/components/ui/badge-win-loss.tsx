import { cn } from "../../lib/utils";

interface BadgeWinLossProps {
  isWin: boolean | null;
  className?: string;
  size?: "xs" | "sm" | "md";
}

export function BadgeWinLoss({ isWin, className, size = "md" }: BadgeWinLossProps) {
  const sizeClasses = {
    xs: "px-1 py-0.5 text-[10px] rounded",
    sm: "px-1.5 py-0.5 text-xs rounded",
    md: "px-2 py-1 text-xs rounded"
  };
  
  return (
    <span
      className={cn(
        sizeClasses[size],
        isWin
          ? "bg-green-500/20 text-green-500"
          : "bg-red-500/20 text-red-500",
        className
      )}
    >
      {isWin ? "Win" : "Loss"}
    </span>
  );
}
