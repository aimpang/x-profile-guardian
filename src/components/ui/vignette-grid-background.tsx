import { cn } from "@/lib/utils";

interface GridVignetteBackgroundProps {
  size?: number;
  x?: number;
  y?: number;
  horizontalVignetteSize?: number;
  verticalVignetteSize?: number;
  intensity?: number;
}

export function GridVignetteBackground({
  className,
  size = 48,
  x = 50,
  y = 50,
  horizontalVignetteSize = 100,
  verticalVignetteSize = 100,
  intensity = 0,
  ...props
}: React.ComponentProps<"div"> & GridVignetteBackgroundProps) {
  return (
    <div
      className={cn("absolute inset-0 h-full w-full", className)}
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--foreground) / 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--foreground) / 0.05) 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
        maskImage: `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${intensity}%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${intensity}%, transparent 100%)`,
      }}
      {...props}
    />
  );
}
