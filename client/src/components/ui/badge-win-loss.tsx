import { cn } from "@/lib/utils";

interface BadgeWinLossProps {
  isWin: boolean | null;
  className?: string;
}

export function BadgeWinLoss({ isWin, className }: BadgeWinLossProps) {
  return (
    <span
      className={cn(
        "px-2 py-1 rounded text-xs",
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
