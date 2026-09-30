import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@client/src/components/Layout';
import IndustriesPage from '@client/src/pages/IndustriesPage/IndustriesPage';
import IndustryDetailPage from '@client/src/pages/IndustryDetailPage/IndustryDetailPage';
import RoleDetailPage from '@client/src/pages/RoleDetailPage/RoleDetailPage';
import ScenarioDetailPage from '@client/src/pages/ScenarioDetailPage/ScenarioDetailPage';
import StepDetailPage from '@client/src/pages/StepDetailPage/StepDetailPage';
import SkillDetailPage from '@client/src/pages/SkillDetailPage/SkillDetailPage';
import CaseDetailPage from '@client/src/pages/CaseDetailPage/CaseDetailPage';
import CustomerDetailPage from '@client/src/pages/CustomerDetailPage/CustomerDetailPage';
import GlobalInsightsPage from '@client/src/pages/GlobalInsightsPage/GlobalInsightsPage';
import SyncAdminPage from '@client/src/pages/SyncAdminPage/SyncAdminPage';

export default function App() {
  return (
    <Routes>
        <Route element={<Layout />}>
          <Route index element={<IndustriesPage />} />
          <Route path="industries" element={<IndustriesPage />} />
          <Route path="industries/:id" element={<IndustryDetailPage />} />
          <Route path="roles/:id" element={<RoleDetailPage />} />
          <Route path="scenarios/:id" element={<ScenarioDetailPage />} />
          <Route path="steps/:id" element={<StepDetailPage />} />
          <Route path="skills/:id" element={<SkillDetailPage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="insights" element={<GlobalInsightsPage />} />
          <Route path="sync-admin" element={<SyncAdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}