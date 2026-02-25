import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminRegister from './pages/auth/AdminRegister';
import VerifyEmail from './pages/auth/VerifyEmail';
import StaffDashboard from './pages/staff/Dashboard';
import StaffQueries from './pages/staff/Queries';
import StaffPromotions from './pages/staff/Promotions';
import Profile from './pages/staff/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import StaffManagement from './pages/admin/StaffManagement';
import PayrollManagement from './pages/admin/PayrollManagement';
import AdminQueries from './pages/admin/Queries';
import AdminPromotions from './pages/admin/Promotions';
import StaffProfile from './pages/admin/StaffProfile';
import SecuritySettings from './pages/admin/SecuritySettings';
import ActivityLogs from './pages/admin/ActivityLogs';
import SeedData from './components/SeedData';

// Placeholder Pages
const Payslips = () => <div>Payslips Content</div>;

export default function App() {
  useEffect(() => {
    document.title = "Tide Payroll System";
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, profile, loading, isAdmin, logout, role } = useAuth();

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/login') document.title = "Login | Tide Payroll";
    else if (path === '/register') document.title = "Register | Tide Payroll";
    else if (path === '/admin/register') document.title = "Admin Register | Tide Payroll";
    else if (path.startsWith('/admin')) document.title = "Admin | Tide Payroll";
    else document.title = "Dashboard | Tide Payroll";
  }, [window.location.pathname]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  if (!user.emailVerified) {
    return (
      <Router>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="*" element={<Navigate to="/verify-email" />} />
        </Routes>
      </Router>
    );
  }

  if (profile?.status === 'pending') {
    return (
      <div className="h-screen flex items-center justify-center bg-tide-bg p-4">
        <div className="max-w-md w-full bg-tide-card rounded-2xl shadow-2xl p-8 text-center space-y-6 border border-tide-gold/10">
          <div className="w-20 h-20 bg-tide-gold/10 rounded-full flex items-center justify-center mx-auto border border-tide-gold/20">
            <Clock className="w-10 h-10 text-tide-gold animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-tide-text">Account Pending</h1>
            <p className="text-tide-muted">
              Your account is currently pending approval from the HR department. 
              You will be notified once your account is active.
            </p>
          </div>
          
          <div className="pt-6 border-t border-tide-gold/10 space-y-4">
            <div className="p-4 bg-tide-bg/50 rounded-xl border border-tide-gold/5 text-left">
              <p className="text-xs text-tide-muted leading-relaxed">
                <span className="text-tide-gold font-bold">Note:</span> If you are an administrator, please ensure you registered through the admin portal.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={logout}
                className="w-full py-3 rounded-xl font-bold bg-tide-gold text-tide-bg hover:bg-tide-gold-hover transition-all"
              >
                Sign Out
              </button>
              <p className="text-xs text-tide-muted">
                Registered as staff by mistake? <a href="/admin/register" className="text-tide-gold hover:underline font-bold">Register as Admin</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          {isAdmin ? (
            <>
              <Route path="/admin" element={<div className="space-y-6"><SeedData /><AdminDashboard /></div>} />
              <Route path="/admin/staff" element={<StaffManagement />} />
              <Route path="/admin/staff/:id" element={<StaffProfile />} />
              <Route path="/profile/:id" element={<StaffProfile />} />
              <Route path="/admin/payroll" element={<PayrollManagement />} />
              <Route path="/admin/queries" element={<AdminQueries />} />
              <Route path="/admin/promotions" element={<AdminPromotions />} />
              <Route path="/admin/logs" element={<ActivityLogs />} />
              <Route path="/admin/security" element={<SecuritySettings />} />
              <Route path="*" element={<Navigate to="/admin" />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<StaffDashboard />} />
              <Route path="/payslips" element={<Payslips />} />
              <Route path="/promotions" element={<StaffPromotions />} />
              <Route path="/queries" element={<StaffQueries />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
}
