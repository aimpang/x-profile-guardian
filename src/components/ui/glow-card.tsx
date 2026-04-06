import { cn } from "@/lib/utils";
import React from "react";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group/card relative rounded-xl overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-border to-transparent opacity-100 group-hover/card:opacity-0 transition-opacity duration-500" />
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-[conic-gradient(from_90deg_at_50%_50%,hsl(var(--border))_0%,hsl(var(--primary)/0.3)_25%,hsl(var(--primary)/0.5)_50%,hsl(var(--primary)/0.3)_75%,hsl(var(--border))_100%)]" />

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-xl bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,hsl(var(--primary)/0.08)_25%,hsl(var(--primary)/0.15)_50%,hsl(var(--primary)/0.08)_75%,transparent_100%)]" />

        {/* Content */}
        <div className="relative m-[1px] rounded-[calc(0.75rem-1px)] bg-secondary/50 backdrop-blur-sm h-[calc(100%-2px)]">
          {children}
        </div>
      </div>
    );
  }
);

GlowCard.displayName = "GlowCard";

export { GlowCard };
