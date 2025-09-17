import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import Dashboard from "@/pages/Dashboard";
import WorkflowVisualizer from "@/pages/WorkflowVisualizer";
import RoleActionVisualizer from "@/pages/RoleActionVisualizer";
import CreateRoleActionMapping from "@/pages/CreateRoleActionMapping";
import EmployeeManagement from "@/pages/EmployeeManagement";
import CreateEmployee from "@/pages/CreateEmployee";
import LocalizationVisualizer from "@/pages/LocalizationVisualizer";
import DataExplorer from "@/pages/DataExplorer";
import ApplicationVisualizer from "@/pages/ApplicationVisualizer";
import RoleToolMapping from "@/pages/RoleToolMapping";
import Unauthorized from "@/pages/Unauthorized";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { RefreshProvider } from "@/lib/contexts/RefreshContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <AuthProvider>
      <RefreshProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/dashboard" element={
                <ProtectedRoute toolId="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/workflow" element={
                <ProtectedRoute toolId="workflow">
                  <WorkflowVisualizer />
                </ProtectedRoute>
              } />
              <Route path="/role-action" element={
                <ProtectedRoute toolId="role-action">
                  <RoleActionVisualizer />
                </ProtectedRoute>
              } />
              <Route path="/role-action/create" element={
                <ProtectedRoute toolId="role-action">
                  <CreateRoleActionMapping />
                </ProtectedRoute>
              } />
              <Route path="/employees" element={
                <ProtectedRoute toolId="employees">
                  <EmployeeManagement />
                </ProtectedRoute>
              } />
              <Route path="/employees/create" element={
                <ProtectedRoute toolId="employees">
                  <CreateEmployee />
                </ProtectedRoute>
              } />
              <Route path="/localization" element={
                <ProtectedRoute toolId="localization">
                  <LocalizationVisualizer />
                </ProtectedRoute>
              } />
              <Route path="/data-explorer" element={<DataExplorer />} />
              <Route path="/applications" element={
                <ProtectedRoute toolId="applications">
                  <ApplicationVisualizer />
                </ProtectedRoute>
              } />
              <Route path="/role-tool-mapping" element={
                <ProtectedRoute toolId="role-tool-mapping">
                  <RoleToolMapping />
                </ProtectedRoute>
              } />
            </Routes>
          </Layout>
        </Router>
        <Toaster />
      </RefreshProvider>
    </AuthProvider>
  );
}

export default App;
