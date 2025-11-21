"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  isCollapsed: boolean;
  toggle: () => void;
  setIsCollapsed: (value: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
);

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const toggle = React.useCallback(() => setIsCollapsed((prev) => !prev), []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      ref={ref}
      data-collapsed={isCollapsed}
      className={cn(
        "group/sidebar relative flex h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        isCollapsed ? "w-[72px]" : "w-64",
        className
      )}
      {...props}
    />
  );
});
Sidebar.displayName = "Sidebar";

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col gap-4", className)}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "space-y-2 rounded-lg border border-sidebar-border/60 p-2",
      className
    )}
    {...props}
  />
));
SidebarGroup.displayName = "SidebarGroup";

export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        "px-2 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60",
        isCollapsed && "sr-only",
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-1", className)} {...props} />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("space-y-1", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("list-none", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

type SidebarMenuButtonProps = {
  asChild?: boolean;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(({ className, asChild, active, children, ...props }, ref) => {
  const { isCollapsed } = useSidebar();

  const mergedClassName = cn(
    "group inline-flex h-11 items-center gap-3 rounded-md text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
    isCollapsed ? "w-11 justify-center px-0" : "w-full justify-start px-3",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground"
      : "text-sidebar-foreground",
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      className: cn(
        mergedClassName,
        (children as React.ReactElement).props.className
      ),
      ...props,
    });
  }

  return (
    <button ref={ref} className={mergedClassName} {...props}>
      {children}
    </button>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { toggle, isCollapsed } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-sidebar text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        className
      )}
      {...props}
    >
      {children ? children : <PanelLeft className="h-4 w-4" />}
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex min-h-screen flex-1 flex-col", className)}
    {...props}
  />
));
SidebarInset.displayName = "SidebarInset";
