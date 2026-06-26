import { useEffect, useState } from "react";
import { IconResumes, IconTemplates, IconSettings } from "@/components/shared/icons/SidebarIcons";
import { usePathname, useRouter } from "@/lib/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import Logo from "@/components/shared/Logo";
import { hydrateFromCloud } from "@/hooks/useResumeCloudSync";
import { UserMenu } from "@/components/auth/UserMenu";

interface MenuItem {
  title: string;
  url?: string;
  href?: string;
  icon: any;
  items?: { title: string; href: string }[];
}

const SIDEBAR_ITEMS: MenuItem[] = [
  { title: "我的简历", url: "/app/dashboard/resumes", icon: IconResumes },
  { title: "简历模板", url: "/app/dashboard/templates", icon: IconTemplates },
  { title: "偏好设置", url: "/app/dashboard/settings", icon: IconSettings },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [collapsible] = useState<"offcanvas" | "icon" | "none">("icon");

  const handleItemClick = (item: MenuItem) => {
    if (item.items) return;
    router.push(item.url || item.href || "/");
  };

  const isItemActive = (item: MenuItem) => {
    if (item.items) {
      return item.items.some((subItem) => pathname === subItem.href);
    }
    return item.url === pathname || item.href === pathname;
  };

  // 登录后从云端 hydrate 简历
  useEffect(() => {
    void hydrateFromCloud();
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar
          collapsible={collapsible}
          className="border-r border-border bg-background"
        >
          <SidebarHeader className="h-16 flex items-center justify-center border-b border-border">
            <div
              className="w-full cursor-pointer flex items-center gap-2.5 px-3"
              onClick={() => router.push("/")}
            >
              <Logo
                className="hover:opacity-80 transition-opacity text-foreground"
                size={24}
              />
              {open && (
                <span className="text-sm font-medium tracking-tight">
                  Magic Resume
                </span>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {SIDEBAR_ITEMS.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <TooltipProvider delayDuration={0} key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={active}
                                className={`w-full transition-colors h-9 [&>svg]:size-auto ${
                                  active
                                    ? "bg-foreground text-background font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                }`}
                              >
                                <div
                                  className="flex items-center gap-2 px-2 cursor-pointer"
                                  onClick={() => handleItemClick(item)}
                                >
                                  <item.icon
                                    size={18}
                                    active={active}
                                  />
                                  {open && (
                                    <span className="flex-1 text-sm">
                                      {item.title}
                                    </span>
                                  )}
                                </div>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </TooltipTrigger>
                          {!open && (
                            <TooltipContent side="right" className="font-medium">
                              {item.title}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-3 border-t border-border">
            <div className="flex items-center justify-between gap-2">
              {open && (
                <span className="text-xs text-muted-foreground truncate">
                  云端同步已开启
                </span>
              )}
              <UserMenu />
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col">
          <div className="p-2">
            <SidebarTrigger />
          </div>
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
