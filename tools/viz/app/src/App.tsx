import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { Dashboard } from '@/pages/Dashboard';
import { WorkflowVisualizer } from '@/pages/WorkflowVisualizer';
import RoleActionVisualizer from '@/pages/RoleActionVisualizer';
import CreateRoleActionMapping from '@/pages/CreateRoleActionMapping';
import EmployeeManagement from '@/pages/EmployeeManagement';
import CreateEmployee from '@/pages/CreateEmployee';
import { LocalizationVisualizer } from '@/pages/LocalizationVisualizer';
import DataExplorer from '@/pages/DataExplorer';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { RefreshProvider } from '@/lib/contexts/RefreshContext';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <AuthProvider>
      <RefreshProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workflow" element={<WorkflowVisualizer />} />
              <Route path="/role-action" element={<RoleActionVisualizer />} />
              <Route path="/role-action/create" element={<CreateRoleActionMapping />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/employees/create" element={<CreateEmployee />} />
              <Route path="/localization" element={<LocalizationVisualizer />} />
              <Route path="/data-explorer" element={<DataExplorer />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster />
      </RefreshProvider>
    </AuthProvider>
  );
}

export default App;