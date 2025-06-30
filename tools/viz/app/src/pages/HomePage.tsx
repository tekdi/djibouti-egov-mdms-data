import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Users, Languages, Database } from 'lucide-react';
import { Link } from "react-router-dom";

const tools = [
  { icon: GitBranch, label: 'Workflow Visualizer', path: '/workflow', description: 'Visualize and understand business process workflows.' },
  { icon: Users, label: 'Role Action Visualizer', path: '/role-action', description: 'Explore roles and the actions they can perform.' },
  { icon: Languages, label: 'Localization Visualizer', path: '/localization', description: 'Manage and view multi-language translations.' },
  { icon: Database, label: 'Data Explorer', path: '/data-explorer', description: 'Browse and query master data from the MDMS.' },
];

export function HomePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome to DIGIT Viz</h2>
      </div>
      <p className="text-muted-foreground">
        A suite of tools for visualizing and managing e-governance data.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <Link to={tool.path} key={tool.path}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{tool.label}</CardTitle>
                <tool.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 