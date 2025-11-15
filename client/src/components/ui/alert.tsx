import { cn } from "@/lib/utils";

interface AlertProps {
  children: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}

export function Alert({ children, variant = "default", className }: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        variant === "destructive"
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : "border-border bg-muted/50",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("text-sm", className)}>{children}</div>;
}
