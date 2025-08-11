import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import { HomePage } from "@/pages/HomePage";
import { Dashboard } from "@/pages/Dashboard";
import { WorkflowVisualizer } from "@/pages/WorkflowVisualizer";
import RoleActionVisualizer from "@/pages/RoleActionVisualizer";
import CreateRoleActionMapping from "@/pages/CreateRoleActionMapping";
import EmployeeManagement from "@/pages/EmployeeManagement";
import CreateEmployee from "@/pages/CreateEmployee";
import { LocalizationVisualizer } from "@/pages/LocalizationVisualizer";
import DataExplorer from "@/pages/DataExplorer";
import { ApplicationVisualizer } from "@/pages/ApplicationVisualizer";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { StudioAdminRoute } from "@/lib/auth/RouteGuards";
import { RefreshProvider } from "@/lib/contexts/RefreshContext";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <AuthProvider>
      <RefreshProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/dashboard"
                element={
                  <StudioAdminRoute>
                    <Dashboard />
                  </StudioAdminRoute>
                }
              />
              <Route
                path="/workflow"
                element={
                  <StudioAdminRoute>
                    <WorkflowVisualizer />
                  </StudioAdminRoute>
                }
              />
              <Route
                path="/role-action"
                element={
                  <StudioAdminRoute>
                    <RoleActionVisualizer />
                  </StudioAdminRoute>
                }
              />
              <Route
                path="/role-action/create"
                element={
                  <StudioAdminRoute>
                    <CreateRoleActionMapping />
                  </StudioAdminRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <StudioAdminRoute>
                    <EmployeeManagement />
                  </StudioAdminRoute>
                }
              />
              <Route
                path="/employees/create"
                element={
                  <StudioAdminRoute>
                    <CreateEmployee />
                  </StudioAdminRoute>
                }
              />
              <Route
                path="/localization"
                element={<LocalizationVisualizer />}
              />
              <Route
                path="/data-explorer"
                element={
                  <StudioAdminRoute>
                    <DataExplorer />
                  </StudioAdminRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <StudioAdminRoute>
                    <ApplicationVisualizer />
                  </StudioAdminRoute>
                }
              />
            </Routes>
          </Layout>
        </Router>
        <Toaster />
      </RefreshProvider>
    </AuthProvider>
  );
}

export default App;
