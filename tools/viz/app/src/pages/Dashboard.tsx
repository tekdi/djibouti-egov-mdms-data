import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Users,
  Globe,
  Database,
  BarChart3,
  Settings,
  Clock,
  CheckCircle,
} from "lucide-react";

const tools = [
  {
    id: "workflow",
    title: "Workflow Visualizer",
    description:
      "Visualize and analyze eGov workflow configurations with interactive diagrams and state transitions.",
    icon: GitBranch,
    href: "/workflow",
    status: "ready",
    features: [
      "Interactive Mermaid diagrams",
      "State transition analysis",
      "Workflow validation",
      "Export capabilities",
    ],
  },
  {
    id: "role-action",
    title: "Role Action Visualizer",
    description:
      "Explore role-action mappings and access control configurations across the eGov platform.",
    icon: Users,
    href: "/role-action",
    status: "ready",
    features: [
      "Role hierarchy visualization",
      "Action permission mapping",
      "Conflict detection",
      "Bulk operations",
    ],
  },
  {
    id: "localization",
    title: "Localization Visualizer",
    description:
      "Manage and visualize localization keys, translations, and language coverage.",
    icon: Globe,
    href: "/localization",
    status: "ready",
    features: [
      "Translation coverage analysis",
      "Missing key detection",
      "Bulk translation support",
      "Language comparison",
    ],
  },
  {
    id: "data-explorer",
    title: "Data Explorer",
    description:
      "Browse and analyze MDMS data configurations with advanced search and filtering.",
    icon: Database,
    href: "/data-explorer",
    status: "ready",
    features: [
      "Hierarchical data browsing",
      "Advanced search & filtering",
      "Data validation",
      "Schema analysis",
    ],
  },
];

const stats = [
  { label: "Visualization Tools", value: "4", icon: BarChart3 },
  { label: "Data Sources", value: "20+", icon: Database },
  { label: "Configurations", value: "150+", icon: Settings },
  { label: "Recent Updates", value: "12", icon: Clock },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">
          Djibouti eGov Visualization Tools
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Comprehensive visualization and analysis tools for eGovernance MDMS
          data, workflows, and system configurations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center p-6">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{tool.title}</CardTitle>
                      <Badge
                        variant={
                          tool.status === "ready" ? "default" : "secondary"
                        }
                        className="mt-1"
                      >
                        {tool.status === "ready" && (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {tool.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-base">
                  {tool.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tool.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center text-sm text-slate-600"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full">
                  <Link to={tool.href}>Open {tool.title}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t">
        <p className="text-slate-600">
          Built for Djibouti eGovernance • Powered by DIGIT Platform
        </p>
      </div>
    </div>
  );
}
