import { 
  Users, 
  FileText, 
  AlertCircle, 
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { UserProfile, Payslip, ActivityLog } from '../../types';
import { orderBy, limit } from 'firebase/firestore';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function AdminDashboard() {
  const { data: staff } = useFirestoreCollection<UserProfile>('users');
  const { data: payslips } = useFirestoreCollection<Payslip>('payslips', [orderBy('month', 'desc'), limit(100)]);
  const { data: logs } = useFirestoreCollection<ActivityLog>('activities', [orderBy('createdAt', 'desc'), limit(5)]);

  const pendingApprovals = staff.filter(s => s.status === 'pending').length;
  const totalActive = staff.filter(s => s.status === 'active').length;
  const onlineUsers = staff.filter(s => s.isOnline).length;
  const totalAdmins = staff.filter(s => s.role === 'admin').length;
  const totalStaff = staff.filter(s => s.role === 'staff').length;
  const totalPayroll = staff.reduce((sum, s) => sum + (s.baseSalary || 0), 0);

  // Chart data
  const chartData = [
    { name: 'Jan', amount: 4500000 },
    { name: 'Feb', amount: 4800000 },
    { name: 'Mar', amount: 5200000 },
    { name: 'Apr', amount: 5100000 },
    { name: 'May', amount: 5500000 },
    { name: 'Jun', amount: totalPayroll > 0 ? totalPayroll : 5800000 },
  ];

  const stats = [
    { label: 'Total Staff', value: staff.length.toString(), icon: Users, color: 'text-tide-gold', bg: 'bg-tide-gold/10' },
    { label: 'Online Now', value: onlineUsers.toString(), icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Monthly Payroll', value: formatCurrency(totalPayroll), icon: FileText, color: 'text-tide-gold', bg: 'bg-tide-gold/10' },
    { label: 'Avg. Salary', value: staff.length > 0 ? formatCurrency(totalPayroll / staff.length) : 'N/A', icon: TrendingUp, color: 'text-tide-gold', bg: 'bg-tide-gold/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-tide-text">Admin Overview</h1>
        <p className="text-tide-muted mt-1">Real-time enterprise payroll analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card-luxury p-6 flex flex-col gap-4 group hover:border-tide-gold/30 transition-all">
            <div className="flex justify-between items-start">
              <div className={cn("p-3 rounded-xl border border-tide-gold/10", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-tide-muted uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-tide-text mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 card-luxury p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-tide-text">Payroll Expenditure Trend</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-tide-gold rounded-full"></div>
              <span className="text-xs text-tide-muted">Monthly Expenditure</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C6A86A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C6A86A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e3a5a" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#A8B3C2' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#A8B3C2' }} 
                  tickFormatter={(value) => `₦${value/1000000}M`} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#132A42', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(198, 168, 106, 0.2)',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' 
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  labelStyle={{ color: '#C6A86A', fontWeight: 'bold' }}
                  formatter={(value: number) => [formatCurrency(value), 'Expenditure']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#C6A86A" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-luxury p-6">
          <h3 className="font-bold text-tide-text mb-8">System Activity</h3>
          <div className="space-y-6">
            {logs.length > 0 ? logs.map((log) => (
              <div key={log.id} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-tide-bg border border-tide-gold/10 flex items-center justify-center shrink-0 group-hover:border-tide-gold/30 transition-all">
                  <Activity className="w-5 h-5 text-tide-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-tide-text truncate">{log.action}</p>
                  <p className="text-xs text-tide-muted mt-1 line-clamp-2">{log.details}</p>
                  <p className="text-[10px] text-tide-muted mt-2 flex items-center gap-2">
                    <span className="text-tide-gold font-bold">{log.performedByName}</span>
                    <span>•</span>
                    <span>{format(log.createdAt?.toDate() || new Date(), 'h:mm a')}</span>
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-tide-muted">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p>No recent activity logs</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-tide-gold hover:bg-tide-gold/10 border border-tide-gold/20 rounded-xl transition-all">
            View Full Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}
