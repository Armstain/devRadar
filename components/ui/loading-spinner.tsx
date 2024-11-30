import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "animate-spin-slow rounded-full",
          "bg-gradient-to-b from-[#6C5CE7] from-35% to-[#E879F9]",
          "filter blur-[1px]",
          "shadow-[0px_-5px_20px_0px_#6C5CE7,0px_5px_20px_0px_#E879F9]",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "absolute inset-0",
            "bg-background",
            "rounded-full",
            "filter blur-[10px]"
          )}
        />
      </div>
    </div>
  );
}
