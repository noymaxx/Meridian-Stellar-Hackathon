import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  className 
}: KPICardProps) {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-fg-muted"
  };

  return (
    <Card className={cn("card-institutional hover-lift", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-4 w-4 text-fg-muted" />}
            <p className="text-body-2 text-fg-secondary font-medium">{title}</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-h2 font-semibold text-fg-primary tabular-nums">
              {value}
            </h3>
            {subtitle && (
              <p className="text-micro text-fg-muted">{subtitle}</p>
            )}
          </div>
        </div>
        
        {trend && trendValue && (
          <div className={cn("text-micro font-medium", trendColors[trend])}>
            {trend === "up" && "↗ "}
            {trend === "down" && "↘ "}
            {trendValue}
          </div>
        )}
      </div>
    </Card>
  );
}