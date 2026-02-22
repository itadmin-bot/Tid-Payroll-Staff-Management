import { 
  Plus, 
  Download, 
  Upload, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Search
} from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { UserProfile, Payslip } from '../../types';
import { orderBy, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatCurrency, calculateTax, calculatePension, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';

export default function PayrollManagement() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: staff } = useFirestoreCollection<UserProfile>('users', [
    orderBy('displayName', 'asc')
  ]);
  
  const { data: payslips } = useFirestoreCollection<Payslip>('payslips', [
    orderBy('month', 'desc')
  ]);

  const activeStaff = staff.filter(s => s.status === 'active');
  const currentMonth = format(new Date(), 'yyyy-MM');

  const handleGeneratePayroll = async () => {
    if (!confirm(`Generate payroll for ${activeStaff.length} active staff for ${format(new Date(), 'MMMM yyyy')}?`)) return;
    
    setIsGenerating(true);
    try {
      for (const member of activeStaff) {
        const gross = member.baseSalary;
        const tax = calculateTax(gross);
        const pension = calculatePension(gross);
        const net = gross - tax - pension;

        await addDoc(collection(db, 'payslips'), {
          userId: member.id,
          userName: member.displayName,
          employeeId: member.employeeId,
          month: currentMonth,
          year: new Date().getFullYear(),
          baseSalary: member.baseSalary,
          allowances: { housing: 0, transport: 0, medical: 0, other: 0 },
          deductions: { tax, pension, loan: 0, other: 0 },
          grossSalary: gross,
          netSalary: net,
          status: 'paid',
          createdAt: serverTimestamp(),
          createdBy: 'admin'
        });

        // Create notification
        await addDoc(collection(db, 'notifications'), {
          userId: member.id,
          title: 'New Payslip Generated',
          message: `Your payslip for ${format(new Date(), 'MMMM yyyy')} is now available.`,
          read: false,
          type: 'payslip',
          createdAt: serverTimestamp()
        });
      }
      alert('Payroll generated successfully!');
    } catch (err) {
      console.error('Error generating payroll:', err);
      alert('Failed to generate payroll');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-slate-500">Generate and manage staff payslips</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGeneratePayroll}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-md disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Monthly Payroll'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Staff</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{activeStaff.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Payroll Total</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">
            {formatCurrency(activeStaff.reduce((sum, s) => sum + (s.baseSalary || 0), 0))}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Run Status</p>
          <div className="flex items-center gap-2 mt-1 text-green-600 font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Recent Payslips Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Recent Payslips</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search payslips..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gross</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deductions</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Net Pay</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payslips.map((slip) => (
              <tr key={slip.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{slip.userName}</p>
                  <p className="text-xs text-slate-500">{slip.employeeId}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {format(new Date(slip.month), 'MMMM yyyy')}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {formatCurrency(slip.grossSalary)}
                </td>
                <td className="px-6 py-4 text-sm text-red-600">
                  -{formatCurrency(slip.deductions.tax + slip.deductions.pension)}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-primary-700">
                  {formatCurrency(slip.netSalary)}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                    {slip.status}
                  </span>
                </td>
              </tr>
            ))}
            {payslips.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No payslips generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
