import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart3,
  GitBranch,
  Users,
  UserCheck,
  Languages,
  Database,
  ClipboardList,
  Menu,
  PanelLeft,
  PanelLeftClose,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth";
import { UserMenu } from "@/components/auth/UserMenu";
import { useRefresh } from "@/lib/contexts/RefreshContext";
import { getCurrentTargetUrl } from "@/lib/api/apiClient";

const navigationItems = [
  { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
  { icon: GitBranch, label: "Workflow Visualizer", path: "/workflow" },
  { icon: Users, label: "Role Action Visualizer", path: "/role-action" },
  { icon: UserCheck, label: "Employee Management", path: "/employees" },
  { icon: Languages, label: "Localization Visualizer", path: "/localization" },
  { icon: Database, label: "Data Explorer", path: "/data-explorer" },
  {
    icon: ClipboardList,
    label: "Application Visualizer",
    path: "/applications",
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { triggerRefresh, isRefreshing } = useRefresh();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTarget, setCurrentTarget] = useState<string>("");

  // Update current target URL on component mount and when it changes
  useEffect(() => {
    const updateTarget = () => {
      setCurrentTarget(getCurrentTargetUrl());
    };

    updateTarget();
    // Listen for storage changes to update when target URL changes
    window.addEventListener("storage", updateTarget);
    return () => window.removeEventListener("storage", updateTarget);
  }, []);

  // Get environment info for theming
  const getEnvironmentInfo = (url: string) => {
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      return {
        name: "Local Dev",
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50/50",
        cardBgColor: "bg-green-50",
        sidebarBg: "bg-muted/40 border-l-4 border-l-green-500",
      };
    } else if (url.includes("djibouti-staging.tekdinext.com")) {
      return {
        name: "QA",
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
        bgColor: "bg-yellow-50/50",
        cardBgColor: "bg-yellow-50",
        sidebarBg: "bg-muted/40 border-l-4 border-l-yellow-500",
      };
    } else if (url.includes("djibouti.tekdinext.com")) {
      return {
        name: "Development",
        color: "bg-blue-500",
        textColor: "text-blue-700",
        bgColor: "bg-blue-50/50",
        cardBgColor: "bg-blue-50",
        sidebarBg: "bg-muted/40 border-l-4 border-l-blue-500",
      };
    } else {
      return {
        name: "Custom",
        color: "bg-purple-500",
        textColor: "text-purple-700",
        bgColor: "bg-purple-50/50",
        cardBgColor: "bg-purple-50",
        sidebarBg: "bg-muted/40 border-l-4 border-l-purple-500",
      };
    }
  };

  const envInfo = getEnvironmentInfo(currentTarget);

  const isStudioAdmin = Boolean(
    user?.roles?.some(
      (role) => role?.name === "Studio Admin" || role?.code === "STUDIO_ADMIN"
    )
  );

  const visibleNavigationItems = isStudioAdmin
    ? navigationItems
    : navigationItems.filter((item) => item.path === "/localization");

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">DIGIT Viz</h1>
            <p className="text-xs text-muted-foreground">
              Data Visualization Suite
            </p>
          </div>
        </div>

        {/* Environment Indicator */}
        {currentTarget && (
          <div className={`mb-6 p-3 rounded-lg border ${envInfo.cardBgColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${envInfo.color}`}></div>
              <span className={`text-sm font-medium ${envInfo.textColor}`}>
                {envInfo.name}
              </span>
            </div>
            <div className="text-xs text-muted-foreground break-all">
              {currentTarget}
            </div>
          </div>
        )}

        <nav className="space-y-2">
          {visibleNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border/50">
        <div className="text-xs text-muted-foreground mb-4 text-center">
          <p className="mb-1 font-medium">DIGIT eGov Platform</p>
          <p>v2.0 Visualization Tools</p>
        </div>

        {/* Logout Button */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col border-r transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        } ${envInfo.sidebarBg || "bg-muted/40"}`}
      >
        <NavContent />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4 lg:px-6">
            <div className="flex items-center gap-2">
              {/* Sidebar Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:inline-flex"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className={`w-64 p-0 ${envInfo.sidebarBg || "bg-background"}`}
                >
                  <NavContent />
                </SheetContent>
              </Sheet>

              <h2 className="text-lg font-semibold ml-2">
                {visibleNavigationItems.find(
                  (item) => item.path === location.pathname
                )?.label || "Localization Visualizer"}
              </h2>

              {/* Environment indicator in header */}
              {currentTarget && (
                <div className="ml-4 hidden sm:flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${envInfo.color}`}
                  ></div>
                  <span className={`text-sm font-medium ${envInfo.textColor}`}>
                    {envInfo.name}
                  </span>
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center space-x-4">
              {user && <UserMenu />}
              <Button
                onClick={() => {
                  try {
                    triggerRefresh();
                  } catch (error) {
                    console.error("Refresh error:", error);
                  }
                }}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                {isRefreshing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
