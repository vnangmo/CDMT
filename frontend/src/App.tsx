import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { FiscalYearProvider } from './contexts/FiscalYearContext';
import MainLayout from './components/layout/MainLayout';
import FiscalYearGuard from './components/FiscalYearGuard';
import Login from './pages/Login';
import './i18n/config';
import './styles/rtl.css';
import Dashboard from './pages/DashboardEnhanced';
import Ministries from './pages/Ministries';
import Users from './pages/Users';
import Roles from './pages/Roles';
import RolePermissions from './pages/RolePermissions';
import AccessMatrix from './pages/AccessMatrix';
import Programs from './pages/Programs';
import Objectives from './pages/Objectives';
import Indicators from './pages/Indicators';
import StrategicAxes from './pages/StrategicAxes';
import EconomicNatures from './pages/EconomicNatures';
import FundingSources from './pages/FundingSources';
import FiscalYears from './pages/FiscalYears';
import HistoricalData from './pages/HistoricalData';
import ImportTemplates from './pages/ImportTemplates';
import MacroFrameworkEnhanced from './pages/MacroFrameworkEnhanced';
import MacroProjections from './pages/MacroProjections';
import RevenueProjections from './pages/RevenueProjections';
import ExpenseProjections from './pages/ExpenseProjections';
import TOFEList from './pages/TOFEList';
import TOFEView from './pages/TOFEView';
import CBMTList from './pages/CBMTList';
import CBMTView from './pages/CBMTView';
import TrendBudgetList from './pages/TrendBudgetList';
import TrendBudgetDetail from './pages/TrendBudgetDetail';
import CDMTGlobalScenarioList from './pages/CDMTGlobalScenarioList';
import CDMTGlobalScenarioDetail from './pages/CDMTGlobalScenarioDetail';
import CDMTGlobalScenarioComparison from './pages/CDMTGlobalScenarioComparison';
import PolicyMeasures from './pages/PolicyMeasures';
import FiscalMargin from './pages/FiscalMargin';
import FiscalMargins from './pages/FiscalMargins';
import IntersectoralAllocation from './pages/IntersectoralAllocation';
import SectoralTrends from './pages/SectoralTrends';
import SectoralTrendsDetailed from './pages/SectoralTrendsDetailed';
import SectoralMeasures from './pages/SectoralMeasures';
import SectoralMeasureDetail from './pages/SectoralMeasureDetail';
import Projects from './pages/Projects';
import ActionPlans from './pages/ActionPlans';
import ActionPlanDetail from './pages/ActionPlanDetail';
import SectoralMeasureValidation from './pages/SectoralMeasureValidation';
import CDSMTSynthesis from './pages/CDSMTSynthesis';
import MinisterialCeilings from './pages/MinisterialCeilings';
import Nomenclatures from './pages/Nomenclatures';
import VersionHistory from './pages/VersionHistory';
import Comments from './pages/Comments';
import Reports from './pages/Reports';
import Exports from './pages/Exports';
import Visualizations from './pages/Visualizations';
import Analytics from './pages/Analytics';
import UserProfile from './pages/UserProfile';
import UserSettings from './pages/UserSettings';
import Settings from './pages/Settings';
import Help from './pages/Help';
import WorkflowSettings from './pages/WorkflowSettings';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Create modern theme inspired by Halal design
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Blue
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#64748b', // Slate
      light: '#94a3b8',
      dark: '#475569',
    },
    success: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AlertProvider>
          <FiscalYearProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

          {/* Protected routes with MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <FiscalYearGuard>
                  <MainLayout />
                </FiscalYearGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Module 1: Cadre Macro & CBMT */}
            <Route path="macro/frameworks" element={<MacroFrameworkEnhanced />} />
            <Route path="macro/projections" element={<MacroProjections />} />
            <Route path="macro/revenues/:macroFrameworkId" element={<RevenueProjections />} />
            <Route path="macro/expenses/:macroFrameworkId" element={<ExpenseProjections />} />
            <Route path="macro/tofe" element={<TOFEList />} />
            <Route path="macro/tofe/:macroFrameworkId" element={<TOFEView />} />
            <Route path="macro/cbmt" element={<CBMTList />} />
            <Route path="macro/cbmt/:cbmtDocumentId" element={<CBMTView />} />

            {/* Module 2: CBMT */}
            <Route path="cbmt" element={<CBMTList />} />
            <Route path="cbmt/:cbmtDocumentId" element={<CBMTView />} />
            <Route path="cbmt/aggregates" element={<CBMTList />} />
            <Route path="cbmt/tables" element={<CBMTList />} />

            {/* Module 3: CDMT Global */}
            <Route path="cdmt-global" element={<CDMTGlobalScenarioList />} />
            <Route path="cdmt-global/:scenarioId" element={<CDMTGlobalScenarioDetail />} />
            <Route path="cdmt-global/compare" element={<CDMTGlobalScenarioComparison />} />
            <Route path="cdmt-global/policy-measures" element={<PolicyMeasures />} />
            <Route path="cdmt-global/fiscal-margin" element={<FiscalMargin />} />
            <Route path="cdmt-global/fiscal-margins" element={<FiscalMargins />} />
            <Route path="cdmt-global/intersectoral" element={<IntersectoralAllocation />} />
            <Route path="ministerial-ceilings" element={<MinisterialCeilings />} />

            {/* Module 4: CDMT Sectoriels */}
            <Route path="sectoral/trends" element={<SectoralTrends />} />
            <Route path="sectoral/trends-detailed" element={<SectoralTrendsDetailed />} />
            <Route path="sectoral-measures" element={<SectoralMeasures />} />
            <Route path="sectoral-measures/:id" element={<SectoralMeasureDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="action-plans" element={<ActionPlans />} />
            <Route path="action-plans/:id" element={<ActionPlanDetail />} />
            <Route path="cdsmt-synthesis" element={<CDSMTSynthesis />} />

            {/* Trend Budgets (legacy route) */}
            <Route path="trend-budgets" element={<TrendBudgetList />} />
            <Route path="trend-budgets/:configId" element={<TrendBudgetDetail />} />

            {/* Module 5: Referentiels */}
            <Route path="ministries" element={<Ministries />} />
            <Route path="nomenclatures" element={<Nomenclatures />} />
            <Route path="programs" element={<Programs />} />
            <Route path="objectives" element={<Objectives />} />
            <Route path="indicators" element={<Indicators />} />
            <Route path="strategic-axes" element={<StrategicAxes />} />
            <Route path="funding-sources" element={<FundingSources />} />
            <Route path="economic-natures" element={<EconomicNatures />} />
            <Route path="fiscal-years" element={<FiscalYears />} />
            <Route path="historical-data" element={<HistoricalData />} />
            <Route path="import-templates" element={<ImportTemplates />} />

            {/* Module 6: Workflow & Validation */}
            <Route path="workflow/validation" element={<SectoralMeasureValidation />} />
            <Route path="workflow/versions" element={<VersionHistory />} />
            <Route path="workflow/comments" element={<Comments />} />
            <Route path="workflow/settings" element={<WorkflowSettings />} />

            {/* Module 7: Reporting */}
            <Route path="reports" element={<Reports />} />
            <Route path="exports" element={<Exports />} />
            <Route path="visualizations" element={<Visualizations />} />
            <Route path="analytics" element={<Analytics />} />

            {/* Administration */}
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="roles/:roleId/permissions" element={<RolePermissions />} />
            <Route path="access-matrix" element={<AccessMatrix />} />

            {/* User Settings */}
            <Route path="profile" element={<UserProfile />} />
            <Route path="user-settings" element={<UserSettings />} />
            <Route path="settings" element={<Settings />} />

            {/* Help & Documentation */}
            <Route path="help" element={<Help />} />
            <Route path="help/documentation" element={<Help />} />
            <Route path="help/videos" element={<Help />} />
            <Route path="help/faq" element={<Help />} />
            <Route path="help/glossary" element={<Help />} />
            <Route path="help/shortcuts" element={<Help />} />
            <Route path="help/roles" element={<Help />} />
          </Route>

          {/* Error Routes */}
          <Route
            path="/unauthorized"
            element={
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                gap: '16px'
              }}>
                <h1>Accès Non Autorisé</h1>
                <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                <a href="/dashboard" style={{color: '#2563eb'}}>Retour au tableau de bord</a>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                gap: '16px'
              }}>
                <h1>404 - Page Non Trouvée</h1>
                <a href="/dashboard" style={{color: '#2563eb'}}>Retour au tableau de bord</a>
              </div>
            }
          />
          </Routes>
          </FiscalYearProvider>
        </AlertProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
