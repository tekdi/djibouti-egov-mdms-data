import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Users, Languages, Database } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useRoleAccess } from "@/lib/hooks/useRoleAccess";
import { Loader2 } from "lucide-react";

const tools = [
  {
    icon: GitBranch,
    label: "Workflow Visualizer",
    path: "/workflow",
    toolId: "workflow",
    description: "Visualize and understand business process workflows.",
  },
  {
    icon: Users,
    label: "Role Action Visualizer",
    path: "/role-action",
    toolId: "role-action",
    description: "Explore roles and the actions they can perform.",
  },
  {
    icon: Languages,
    label: "Localization Visualizer",
    path: "/localization",
    toolId: "localization",
    description: "Manage and view multi-language translations.",
  },
  {
    icon: Database,
    label: "Data Explorer",
    path: "/data-explorer",
    toolId: "data-explorer",
    description: "Browse and query master data from the MDMS.",
  },
];

export default function HomePage() {
  const { hasAccess, allowedTools, isLoading } = useRoleAccess();

  // Show loading while checking permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auto-redirect logic after loading is complete
  if (!isLoading && allowedTools.length > 0) {
    // If user only has access to localization, redirect there
    if (allowedTools.length === 1 && allowedTools[0] === 'localization') {
      console.log('User only has localization access, redirecting...');
      return <Navigate to="/localization" replace />;
    }
    
    // If user has dashboard access, redirect there
    if (allowedTools.includes('dashboard')) {
      console.log('User has dashboard access, redirecting...');
      return <Navigate to="/dashboard" replace />;
    }
    
    // Otherwise, redirect to the first available tool
    const firstAvailableTool = tools.find(tool => hasAccess(tool.toolId));
    if (firstAvailableTool) {
      console.log(`Redirecting to first available tool: ${firstAvailableTool.path}`);
      return <Navigate to={firstAvailableTool.path} replace />;
    }
  }

  // Filter tools based on access
  const accessibleTools = tools.filter(tool => hasAccess(tool.toolId));
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome to DIGIT Viz
        </h2>
      </div>
      <p className="text-muted-foreground">
        A suite of tools for visualizing and managing e-governance data.
      </p>
      {accessibleTools.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              No tools are currently accessible with your role permissions.
              Please contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {accessibleTools.map((tool) => (
            <Link to={tool.path} key={tool.path}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {tool.label}
                  </CardTitle>
                  <tool.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
