import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Moon, Package, Sun, Truck, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "../ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", icon: Home, to: "/home" },
  { label: "Customers", icon: Users, to: "/customers" },
  { label: "Products", icon: Package, to: "/products" },
  { label: "Suppliers", icon: Truck, to: "/suppliers" },
];

function SidebarNav() {
  const location = useLocation();
  const { isCollapsed } = useSidebar();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.to ||
          location.pathname.startsWith(`${item.to}/`);

        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              asChild
              active={isActive}
              aria-label={item.label}
              title={item.label}
            >
              <NavLink
                to={item.to}
                className="flex w-full items-center gap-3"
              >
                <item.icon className="h-4 w-4" />
                <span className={cn("truncate", isCollapsed && "hidden")}>
                  {item.label}
                </span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

export default function MainLayout() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen max-h-screen overflow-hidden bg-background text-foreground">
        <Sidebar className="bg-sidebar text-sidebar-foreground">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarNav />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="bg-background text-foreground max-h-screen">
          <header className="flex h-14 items-center gap-3 border-b border-border/70 bg-card px-4">
            <SidebarTrigger />
            <div className="text-sm font-semibold tracking-wide">
              Inventory
            </div>
            <div className="ml-auto">
              <button
                type="button"
                aria-label="Toggle theme"
                onClick={() =>
                  setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/80 text-foreground shadow-sm transition hover:bg-accent"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-auto px-6 py-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
