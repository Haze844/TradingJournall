import { cn } from "@/lib/utils";

interface BadgeTrendProps {
  trend: string;
  className?: string;
  size?: "xs" | "sm" | "md";
}

export function BadgeTrend({ trend, className, size = "md" }: BadgeTrendProps) {
  // Bestimme die Farbe basierend auf dem Trend (Long = grün, Short = rot)
  const isLong = trend.toLowerCase().includes('long');
  const isShort = trend.toLowerCase().includes('short');
  
  const sizeClasses = {
    xs: "px-1 py-0.5 text-[10px] rounded",
    sm: "px-1.5 py-0.5 text-xs rounded",
    md: "px-2 py-1 text-xs rounded"
  };
  
  return (
    <span
      className={cn(
        sizeClasses[size],
        isLong
          ? "bg-green-500/20 text-green-500"
          : isShort 
            ? "bg-red-500/20 text-red-500"
            : "bg-blue-500/20 text-blue-500", // Neutral/Range oder anderes
        className
      )}
    >
      {trend}
    </span>
  );
}