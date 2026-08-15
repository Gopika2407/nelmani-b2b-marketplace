import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Onboarding from './pages/Onboarding';
import SupplierDashboard from './pages/SupplierDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

const DashboardResolver = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#080c09' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading Nelmani Commerce Hub...</p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }

  // Route to the dashboard matching their authorized B2B role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'supplier':
      return <SupplierDashboard />;
    case 'buyer':
      return <BuyerDashboard />;
    default:
      return <Navigate to="/onboarding" replace />;
  }
};

const OnboardingResolver = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <Onboarding />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/onboarding/*" element={
            <div style={{ minHeight: '100vh' }}>
              <Routes>
                <Route path="/" element={<OnboardingResolver />} />
              </Routes>
            </div>
          } />
          <Route path="/*" element={<DashboardResolver />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
