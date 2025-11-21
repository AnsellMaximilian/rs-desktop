import * as React from "react";
import { PanelLeft } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(true);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  const value = React.useMemo(() => ({ isOpen, toggle }), [isOpen, toggle]);

  return (
    <SidebarContext.Provider value={value}>
      <div className="flex min-h-screen bg-white text-slate-900">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

const sidebarVariants = cva(
  "border-border bg-sidebar text-sidebar-foreground border-r shadow-sm transition-[width] duration-200 overflow-hidden",
  {
    variants: {
      collapsed: {
        true: "w-16",
        false: "w-64",
      },
    },
    defaultVariants: {
      collapsed: false,
    },
  }
);

type SidebarProps = React.ComponentProps<"aside"> &
  VariantProps<typeof sidebarVariants>;

export function Sidebar({ className, collapsed, ...props }: SidebarProps) {
  const { isOpen } = useSidebar();
  const isCollapsed = collapsed ?? !isOpen;
  return (
    <aside
      data-collapsed={isCollapsed}
      className={cn(
        sidebarVariants({ collapsed: isCollapsed }),
        isCollapsed && "w-14",
        className
      )}
      {...props}
    />
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-2 px-4 py-3", className)}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("space-y-3 px-3 py-2", className)} {...props} />
  );
}

export function SidebarGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

export function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isOpen } = useSidebar();
  if (!isOpen) return null;
  return (
    <div
      className={cn(
        "px-3 text-xs font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/70",
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-xl bg-sidebar/40 px-1 py-1.5", className)} {...props} />
  );
}

export function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul className={cn("flex flex-col gap-1 px-1", className)} {...props} />
  );
}

export function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return <li className={cn("list-none", className)} {...props} />;
}

type SidebarMenuButtonProps = React.ComponentProps<"button"> & {
  active?: boolean;
};

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(({ className, active, children, ...props }, ref) => {
  const { isOpen } = useSidebar();
  const nodes = React.Children.toArray(children);
  return (
    <button
      ref={ref}
      data-active={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        className
      )}
      {...props}
    >
      <div className="flex w-full items-center gap-3 truncate">
        {nodes.map((child, idx) => {
          if (idx === 0) return child;
          return (
            <span
              key={idx}
              className={cn(
                "truncate",
                !isOpen && "sr-only",
                !isOpen && "opacity-0"
              )}
            >
              {child}
            </span>
          );
        })}
      </div>
    </button>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

export function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { toggle } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white transition hover:border-sidebar-accent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        className
      )}
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="hidden md:inline">Toggle</span>
    </button>
  );
}

export function SidebarInset({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 min-w-0", className)} {...props} />;
}
