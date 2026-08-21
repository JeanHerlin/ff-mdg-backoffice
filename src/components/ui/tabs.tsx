import { cn } from "@/lib/utils";

export function TabList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex gap-1 overflow-x-auto border-b border-border", className)}>{children}</div>;
}

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
