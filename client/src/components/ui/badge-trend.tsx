import { cn } from "@/lib/utils";

interface BadgeTrendProps {
  trend: string;
  className?: string;
}

export function BadgeTrend({ trend, className }: BadgeTrendProps) {
  // Bestimme die Farbe basierend auf dem Trend (Long = grün, Short = rot)
  const isLong = trend.toLowerCase().includes('long');
  const isShort = trend.toLowerCase().includes('short');
  
  return (
    <span
      className={cn(
        "px-2 py-1 rounded text-xs",
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