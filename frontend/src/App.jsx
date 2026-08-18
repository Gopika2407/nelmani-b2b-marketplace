import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Onboarding from './pages/Onboarding';
import SupplierDashboard from './pages/SupplierDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

const DashboardResolver = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px' }}>
          <Loader2 size={36} className="animate-spin text-amber-400" />
          <p style={{ fontSize: '0.95rem' }}>Loading Nelmani Commerce Hub...</p>
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
    <ThemeProvider>
      <LanguageProvider>
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
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
