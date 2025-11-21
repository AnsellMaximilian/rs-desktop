import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Package, Users } from "lucide-react";
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
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
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
        <SidebarInset className="bg-background text-foreground">
          <header className="flex h-14 items-center gap-3 border-b border-border/70 bg-card px-4">
            <SidebarTrigger />
            <div className="text-sm font-semibold tracking-wide">
              Inventory
            </div>
          </header>
          <main className="flex-1 px-6 py-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
