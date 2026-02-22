import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  UserCircle, 
  Settings, 
  LogOut, 
  Bell, 
  HelpCircle, 
  TrendingUp,
  Users,
  MessageSquare,
  Activity
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Staff Management', path: '/admin/staff' },
    { icon: FileText, label: 'Payroll', path: '/admin/payroll' },
    { icon: MessageSquare, label: 'Queries', path: '/admin/queries' },
    { icon: TrendingUp, label: 'Promotions', path: '/admin/promotions' },
    { icon: Activity, label: 'Activity Logs', path: '/admin/logs' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ] : [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: FileText, label: 'My Payslips', path: '/payslips' },
    { icon: TrendingUp, label: 'Promotions', path: '/promotions' },
    { icon: MessageSquare, label: 'Queries', path: '/queries' },
    { icon: UserCircle, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="flex h-screen bg-tide-bg overflow-hidden text-tide-text">
      {/* Sidebar */}
      <aside className="w-64 bg-tide-bg border-r border-tide-gold/10 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-tide-gold tracking-tight">Tidé Hotels</h1>
          <p className="text-[10px] text-tide-muted font-medium uppercase tracking-widest mt-1">Management System</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-tide-gold text-tide-bg font-bold shadow-lg" 
                    : "text-tide-muted hover:bg-tide-card hover:text-tide-text"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-tide-bg" : "text-tide-gold/60 group-hover:text-tide-gold")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-tide-gold/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-tide-muted hover:text-tide-danger hover:bg-tide-danger/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-tide-bg border-b border-tide-gold/10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-tide-text capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-tide-muted hover:text-tide-gold transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-tide-danger rounded-full border-2 border-tide-bg"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-tide-gold/10">
              <div className="text-right">
                <p className="text-sm font-semibold text-tide-text">{profile?.displayName}</p>
                <p className="text-[10px] text-tide-muted uppercase tracking-wider">{profile?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-tide-card border border-tide-gold/20 flex items-center justify-center text-tide-gold font-bold">
                {profile?.displayName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-tide-bg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
