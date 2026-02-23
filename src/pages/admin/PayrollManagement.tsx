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
  const [searchTerm, setSearchTerm] = useState('');
  const { data: staff } = useFirestoreCollection<UserProfile>('users', [
    orderBy('displayName', 'asc')
  ]);
  
  const { data: payslips } = useFirestoreCollection<Payslip>('payslips', [
    orderBy('month', 'desc')
  ]);

  const activeStaff = staff.filter(s => s.status === 'active');
  const currentMonth = format(new Date(), 'yyyy-MM');

  const filteredPayslips = payslips.filter(slip => 
    slip.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tide-text">Payroll Management</h1>
          <p className="text-tide-muted mt-1">Generate and manage staff payslips</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleGeneratePayroll}
            disabled={isGenerating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-tide-gold text-tide-bg rounded-xl font-bold hover:bg-tide-gold-hover transition shadow-lg shadow-tide-gold/20 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Payroll'}
          </button>
          <button className="p-3 bg-tide-card border border-tide-gold/10 rounded-xl text-tide-gold hover:bg-tide-gold/10 transition-all">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-luxury p-6">
          <p className="text-[10px] font-bold text-tide-muted uppercase tracking-widest">Active Staff</p>
          <p className="text-2xl font-bold text-tide-text mt-2">{activeStaff.length}</p>
        </div>
        <div className="card-luxury p-6 border-l-4 border-l-tide-gold">
          <p className="text-[10px] font-bold text-tide-muted uppercase tracking-widest">Monthly Total</p>
          <p className="text-2xl font-bold text-tide-gold mt-2">
            {formatCurrency(activeStaff.reduce((sum, s) => sum + (s.baseSalary || 0), 0))}
          </p>
        </div>
        <div className="card-luxury p-6">
          <p className="text-[10px] font-bold text-tide-muted uppercase tracking-widest">Last Run Status</p>
          <div className="flex items-center gap-2 mt-2 text-green-500 font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Recent Payslips Table */}
      <div className="card-luxury overflow-hidden">
        <div className="p-6 border-b border-tide-gold/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-bold text-tide-text">Recent Payslips</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tide-muted" />
            <input 
              type="text" 
              placeholder="Search payslips..."
              className="input-field w-full pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-tide-bg/50 border-b border-tide-gold/10">
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Month</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Gross</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Deductions</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Net Pay</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tide-gold/5">
              {filteredPayslips.map((slip) => (
                <tr key={slip.id} className="hover:bg-tide-gold/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-tide-text">{slip.userName}</p>
                    <p className="text-[10px] text-tide-muted uppercase tracking-wider">{slip.employeeId}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-tide-muted">
                    {format(new Date(slip.month), 'MMMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-tide-text">
                    {formatCurrency(slip.grossSalary)}
                  </td>
                  <td className="px-6 py-4 text-sm text-tide-danger">
                    -{formatCurrency(slip.deductions.tax + slip.deductions.pension)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-tide-gold">
                    {formatCurrency(slip.netSalary)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                      {slip.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPayslips.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-tide-muted italic">
                    No payslips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
