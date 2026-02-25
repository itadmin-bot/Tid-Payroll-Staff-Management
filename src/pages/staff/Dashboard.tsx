import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  FileText, 
  MessageSquare, 
  Bell,
  ArrowUpRight,
  Download,
  User,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { Payslip, AppNotification, StaffQuery } from '../../types';
import { where, orderBy, limit } from 'firebase/firestore';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { generatePayslipPDF } from '../../lib/pdfGenerator';
import { Link, useNavigate } from 'react-router-dom';

export default function StaffDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const payslipConstraints = useMemo(() => [
    where('userId', '==', profile?.uid || ''),
    orderBy('createdAt', 'desc'),
    limit(5)
  ], [profile?.uid]);

  const notificationConstraints = useMemo(() => [
    where('userId', '==', profile?.uid || ''),
    orderBy('createdAt', 'desc'),
    limit(5)
  ], [profile?.uid]);

  const queryConstraints = useMemo(() => [
    where('userId', '==', profile?.uid || ''),
    orderBy('createdAt', 'desc'),
    limit(3)
  ], [profile?.uid]);

  const { data: payslips, loading: payslipsLoading, error: payslipsError } = useFirestoreCollection<Payslip>('payslips', payslipConstraints, !!profile?.uid);
  const { data: notifications, loading: notificationsLoading } = useFirestoreCollection<AppNotification>('notifications', notificationConstraints, !!profile?.uid);
  const { data: queries, loading: queriesLoading } = useFirestoreCollection<StaffQuery>('queries', queryConstraints, !!profile?.uid);

  if (payslipsLoading || notificationsLoading || queriesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-tide-gold animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Base Salary', value: formatCurrency(profile?.baseSalary || 0), icon: TrendingUp, color: 'text-tide-gold' },
    { label: 'Total Payslips', value: payslips.length.toString(), icon: FileText, color: 'text-tide-gold' },
    { label: 'Active Queries', value: queries.filter(q => q.status === 'open').length.toString(), icon: MessageSquare, color: 'text-tide-gold' },
    { label: 'Notifications', value: notifications.filter(n => !n.read).length.toString(), icon: Bell, color: 'text-tide-danger' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tide-text">Welcome back, {profile?.displayName}</h1>
          <p className="text-tide-muted mt-1">Here's what's happening with your account today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/profile/${profile?.uid}`)}
            className="flex items-center gap-2 px-4 py-2 bg-tide-gold text-tide-bg rounded-lg font-bold hover:bg-tide-gold-hover transition-all shadow-lg shadow-tide-gold/10"
          >
            <User className="w-4 h-4" />
            View Profile
          </button>
          <div className="px-4 py-2 bg-tide-gold/10 border border-tide-gold/20 rounded-lg">
            <span className="text-xs font-bold text-tide-gold uppercase tracking-widest">
              Status: {profile?.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card-luxury p-6 flex items-center gap-4 group hover:border-tide-gold/30 transition-all">
            <div className="p-3 bg-tide-bg rounded-xl border border-tide-gold/10 group-hover:scale-110 transition-transform">
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-medium text-tide-muted uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-tide-text mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Payslips */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-tide-text">Recent Payslips</h3>
            <Link to="/payslips" className="text-sm text-tide-gold hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="card-luxury overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-tide-bg/50 border-b border-tide-gold/10">
                    <th className="px-6 py-4 text-xs font-bold text-tide-muted uppercase tracking-widest">Month</th>
                    <th className="px-6 py-4 text-xs font-bold text-tide-muted uppercase tracking-widest">Gross Pay</th>
                    <th className="px-6 py-4 text-xs font-bold text-tide-muted uppercase tracking-widest">Net Pay</th>
                    <th className="px-6 py-4 text-xs font-bold text-tide-muted uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tide-gold/5">
                  {payslips.length > 0 ? payslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-tide-gold/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-tide-bg rounded-lg">
                            <FileText className="w-4 h-4 text-tide-gold" />
                          </div>
                          <span className="font-medium text-tide-text">{payslip.month}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-tide-muted">{formatCurrency(payslip.grossSalary)}</td>
                      <td className="px-6 py-4 font-bold text-tide-gold">{formatCurrency(payslip.netSalary)}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => generatePayslipPDF(payslip, profile!)}
                          className="p-2 text-tide-muted hover:text-tide-gold hover:bg-tide-gold/10 rounded-lg transition-all"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-tide-muted">
                        No payslips found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notifications & Queries */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-tide-text">Notifications</h3>
            <div className="space-y-4">
              {notifications.length > 0 ? notifications.map((notif) => (
                <div key={notif.id} className={cn(
                  "p-4 rounded-xl border transition-all",
                  notif.read 
                    ? "bg-tide-bg/30 border-tide-gold/5" 
                    : "bg-tide-gold/5 border-tide-gold/20 shadow-lg shadow-tide-gold/5"
                )}>
                  <div className="flex gap-3">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      notif.read ? "bg-tide-bg" : "bg-tide-gold text-tide-bg"
                    )}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", notif.read ? "text-tide-muted" : "text-tide-text font-semibold")}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-tide-muted mt-1">
                        {format(notif.createdAt?.toDate() || new Date(), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 card-luxury">
                  <p className="text-sm text-tide-muted">No new notifications</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-tide-text">Recent Queries</h3>
              <Link to="/queries" className="text-xs text-tide-gold hover:underline">New Query</Link>
            </div>
            <div className="space-y-4">
              {queries.map((query) => (
                <div key={query.id} className="p-4 card-luxury hover:border-tide-gold/20 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                      query.status === 'resolved' ? "bg-green-500/10 text-green-500" : "bg-tide-gold/10 text-tide-gold"
                    )}>
                      {query.status}
                    </span>
                    <span className="text-[10px] text-tide-muted">
                      {format(query.createdAt?.toDate() || new Date(), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-tide-text line-clamp-1">{query.subject}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
