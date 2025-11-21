import { Outlet } from "react-router-dom";
import { Building2, Package, Users } from "lucide-react";
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
} from "../ui/sidebar";

export default function MainLayout() {
  return (
    <SidebarProvider>
      <Sidebar className="bg-sidebar text-sidebar-foreground">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { label: "Customers", icon: Users },
                  { label: "Suppliers", icon: Building2 },
                  { label: "Products", icon: Package },
                ].map((item, idx) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton active={idx === 0}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex min-h-screen flex-col bg-slate-950 text-white">
        <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-slate-900/60 px-4 backdrop-blur">
          <SidebarTrigger />
          <div className="text-sm font-semibold tracking-wide text-emerald-100">
            Example
          </div>
        </header>
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
