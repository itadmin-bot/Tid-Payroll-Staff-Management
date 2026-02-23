import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  CreditCard,
  Save,
  Shield,
  FileText,
  Download,
  Calendar,
  History,
  Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Payslip } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Profile() {
  const { profile, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    phoneNumber: profile?.phoneNumber || '',
    bankName: profile?.bankName || '',
    accountNumber: profile?.accountNumber || '',
    department: profile?.department || '',
    designation: profile?.designation || ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        phoneNumber: profile.phoneNumber || '',
        bankName: profile.bankName || '',
        accountNumber: profile.accountNumber || '',
        department: profile.department || '',
        designation: profile.designation || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(
      collection(db, 'payslips'),
      where('userId', '==', profile.uid),
      orderBy('month', 'desc'),
      limit(12)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Payslip));
      setPayslips(data);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      await refreshUser();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (payslip: Payslip) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(198, 168, 106); // Tide Gold
    doc.text('Tidé Hotels Management System', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(20, 42, 66); // Dark Blue
    doc.text('Official Payslip', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Month: ${payslip.month}`, 20, 45);
    doc.text(`Employee ID: ${payslip.employeeId}`, 20, 50);
    doc.text(`Employee Name: ${payslip.userName}`, 20, 55);
    doc.text(`Date Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 140, 45);

    // Earnings Table
    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Amount']],
      body: [
        ['Base Salary', formatCurrency(payslip.baseSalary)],
        ['Housing Allowance', formatCurrency(payslip.allowances.housing)],
        ['Transport Allowance', formatCurrency(payslip.allowances.transport)],
        ['Medical Allowance', formatCurrency(payslip.allowances.medical)],
        ['Other Allowances', formatCurrency(payslip.allowances.other)],
        [{ content: 'Gross Salary', styles: { fontStyle: 'bold' } }, { content: formatCurrency(payslip.grossSalary), styles: { fontStyle: 'bold' } }],
      ],
      theme: 'striped',
      headStyles: { fillColor: [198, 168, 106] },
    });

    // Deductions Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Deductions', 'Amount']],
      body: [
        ['Tax', formatCurrency(payslip.deductions.tax)],
        ['Pension', formatCurrency(payslip.deductions.pension)],
        ['Loan Repayment', formatCurrency(payslip.deductions.loan)],
        ['Other Deductions', formatCurrency(payslip.deductions.other)],
        [{ content: 'Total Deductions', styles: { fontStyle: 'bold' } }, { content: formatCurrency(payslip.deductions.tax + payslip.deductions.pension + payslip.deductions.loan + payslip.deductions.other), styles: { fontStyle: 'bold' } }],
      ],
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] }, // Danger Red
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.setTextColor(198, 168, 106);
    doc.text(`Net Salary Payable: ${formatCurrency(payslip.netSalary)}`, 105, finalY, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This is a computer-generated document. No signature required.', 105, 280, { align: 'center' });

    doc.save(`Payslip_${payslip.userName}_${payslip.month}.pdf`);
  };

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-tide-text">My Profile</h1>
          <p className="text-tide-muted mt-1">Manage your personal and professional information</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "px-6 py-2 rounded-xl font-bold transition-all",
            isEditing 
              ? "bg-tide-danger/10 text-tide-danger border border-tide-danger/20 hover:bg-tide-danger/20" 
              : "bg-tide-gold text-tide-bg hover:bg-tide-gold-hover shadow-lg"
          )}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Hero */}
      <div className="card-luxury p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-tide-bg border-2 border-tide-gold/30 flex items-center justify-center text-4xl font-bold text-tide-gold shadow-2xl shadow-tide-gold/10">
            {profile.displayName?.charAt(0)}
          </div>
          <div className={cn(
            "absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-tide-card",
            profile.status === 'active' ? "bg-green-500" : "bg-tide-danger"
          )}></div>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-3xl font-bold text-tide-text">{profile.displayName}</h1>
            <span className="px-3 py-1 bg-tide-gold/10 text-tide-gold text-[10px] font-bold uppercase tracking-widest rounded-full border border-tide-gold/20">
              {profile.role}
            </span>
          </div>
          <p className="text-tide-muted mt-2 flex items-center justify-center md:justify-start gap-2">
            <Briefcase className="w-4 h-4 text-tide-gold" />
            {profile.designation || 'Position Not Set'} • {profile.department || 'Department Not Set'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 text-sm text-tide-muted">
              <Mail className="w-4 h-4" /> {profile.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-tide-muted">
              <Phone className="w-4 h-4" /> {profile.phoneNumber || 'No Phone'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="bg-tide-bg/50 p-4 rounded-2xl border border-tide-gold/5 text-center">
            <p className="text-[10px] text-tide-muted uppercase tracking-widest">Employee ID</p>
            <p className="text-lg font-bold text-tide-text mt-1">{profile.employeeId}</p>
          </div>
          <div className="bg-tide-bg/50 p-4 rounded-2xl border border-tide-gold/5 text-center">
            <p className="text-[10px] text-tide-muted uppercase tracking-widest">Base Salary</p>
            <p className="text-lg font-bold text-tide-gold mt-1">{formatCurrency(profile.baseSalary || 0)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information */}
          <section className="card-luxury p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-tide-gold/10 pb-4">
              <User className="w-5 h-5 text-tide-gold" />
              <h3 className="text-xl font-bold text-tide-text">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Full Name</label>
                <input 
                  type="text"
                  disabled={!isEditing}
                  className="input-field w-full disabled:opacity-50"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Email Address</label>
                <input 
                  type="email"
                  disabled
                  className="input-field w-full opacity-50 cursor-not-allowed"
                  value={profile.email}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Phone Number</label>
                <input 
                  type="text"
                  disabled={!isEditing}
                  className="input-field w-full disabled:opacity-50"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Joined Date</label>
                <div className="input-field w-full opacity-50 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-tide-gold" />
                  {profile.createdAt ? format(profile.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                </div>
              </div>
            </div>
          </section>

          {/* Recent Payslips */}
          <section className="card-luxury p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-tide-gold/10 pb-4">
              <FileText className="w-5 h-5 text-tide-gold" />
              <h3 className="text-xl font-bold text-tide-text">Recent Payslips</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-tide-muted uppercase tracking-widest">
                    <th className="pb-4">Month</th>
                    <th className="pb-4">Gross</th>
                    <th className="pb-4">Net</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tide-gold/5">
                  {payslips.length > 0 ? payslips.map((payslip) => (
                    <tr key={payslip.id} className="group">
                      <td className="py-4 text-sm font-medium text-tide-text">{payslip.month}</td>
                      <td className="py-4 text-sm text-tide-muted">{formatCurrency(payslip.grossSalary)}</td>
                      <td className="py-4 text-sm font-bold text-tide-gold">{formatCurrency(payslip.netSalary)}</td>
                      <td className="py-4 text-right">
                        <button 
                          type="button"
                          onClick={() => generatePDF(payslip)}
                          className="p-2 text-tide-gold hover:bg-tide-gold/10 rounded-lg transition-all"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-tide-muted italic">
                        No recent payslips found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Banking Information */}
          <section className="card-luxury p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-tide-gold/10 pb-4">
              <CreditCard className="w-5 h-5 text-tide-gold" />
              <h3 className="text-xl font-bold text-tide-text">Banking</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Bank Name</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  className="input-field w-full disabled:opacity-50"
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Account Number</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  className="input-field w-full disabled:opacity-50"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Professional Info */}
          <section className="card-luxury p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-tide-gold/10 pb-4">
              <Briefcase className="w-5 h-5 text-tide-gold" />
              <h3 className="text-xl font-bold text-tide-text">Professional</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Department</label>
                <input 
                  type="text" 
                  disabled
                  className="input-field w-full opacity-60"
                  value={profile.department || 'Not Set'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Designation</label>
                <input 
                  type="text" 
                  disabled
                  className="input-field w-full opacity-60"
                  value={profile.designation || 'Not Set'}
                />
              </div>
            </div>
          </section>

          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-4"
            >
              <button 
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 shadow-2xl shadow-tide-gold/20"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving Changes...' : 'Save All Changes'}
              </button>
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
}
