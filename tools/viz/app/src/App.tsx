import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { WorkflowVisualizer } from '@/pages/WorkflowVisualizer';
import { RoleActionVisualizer } from '@/pages/RoleActionVisualizer';
import { LocalizationVisualizer } from '@/pages/LocalizationVisualizer';
import { DataExplorer } from '@/pages/DataExplorer';
import { AuthProvider } from '@/lib/auth/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workflow" element={<WorkflowVisualizer />} />
            <Route path="/role-action" element={<RoleActionVisualizer />} />
            <Route path="/localization" element={<LocalizationVisualizer />} />
            <Route path="/data-explorer" element={<DataExplorer />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;