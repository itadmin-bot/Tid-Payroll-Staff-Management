import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search,
  Award,
  ArrowUpRight,
  X
} from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { UserProfile, Promotion } from '../../types';
import { orderBy, doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function AdminPromotions() {
  const [showForm, setShowForm] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: staff } = useFirestoreCollection<UserProfile>('users', [
    orderBy('displayName', 'asc')
  ]);
  
  const { data: promotions } = useFirestoreCollection<Promotion>('promotions', [
    orderBy('createdAt', 'desc')
  ]);

  const activeStaff = staff.filter(s => s.status === 'active');

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    const member = staff.find(s => s.id === selectedStaffId);
    if (!member) return;

    setIsSubmitting(true);
    try {
      const oldSalary = member.baseSalary || 0;
      const oldDesignation = member.designation || 'Staff Member';
      const salaryNum = parseFloat(newSalary);

      // 1. Create Promotion Record
      await addDoc(collection(db, 'promotions'), {
        userId: member.id,
        userName: member.displayName,
        oldDesignation,
        newDesignation,
        oldSalary,
        newSalary: salaryNum,
        effectiveDate: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // 2. Update User Profile
      await updateDoc(doc(db, 'users', member.id), {
        designation: newDesignation,
        baseSalary: salaryNum,
        updatedAt: serverTimestamp()
      });

      // 3. Notify User
      await addDoc(collection(db, 'notifications'), {
        userId: member.id,
        title: 'Congratulations on your Promotion!',
        message: `You have been promoted to ${newDesignation} with a revised salary of ${formatCurrency(salaryNum)}.`,
        read: false,
        type: 'promotion',
        createdAt: serverTimestamp()
      });

      setShowForm(false);
      setSelectedStaffId('');
      setNewDesignation('');
      setNewSalary('');
      alert('Promotion processed successfully!');
    } catch (err) {
      console.error('Error promoting staff:', err);
      alert('Failed to process promotion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-tide-text">Promotions & Growth</h1>
          <p className="text-tide-muted">Manage staff career advancement and salary adjustments</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-tide-gold text-tide-bg rounded-xl font-bold hover:bg-tide-gold-hover transition shadow-lg shadow-tide-gold/20"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Promotion'}
        </button>
      </div>

      {showForm && (
        <div className="card-luxury p-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-bold text-tide-text mb-6">Process New Promotion</h3>
          <form onSubmit={handlePromote} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Select Staff</label>
              <select 
                required
                className="input-field w-full"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="">Choose an employee...</option>
                {activeStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.displayName} ({s.designation || 'No Role'})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">New Designation</label>
              <input 
                type="text" 
                required
                className="input-field w-full"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                placeholder="e.g. Senior Manager"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">New Base Salary (Monthly)</label>
              <input 
                type="number" 
                required
                className="input-field w-full"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                placeholder="e.g. 350000"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-4 pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-tide-gold text-tide-bg rounded-xl font-bold hover:bg-tide-gold-hover transition disabled:opacity-50 shadow-lg shadow-tide-gold/20"
              >
                <Award className="w-4 h-4" />
                {isSubmitting ? 'Processing...' : 'Confirm Promotion'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-tide-bg/50 border-b border-tide-gold/10">
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Role Change</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Salary Change</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tide-gold/5">
              {promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-tide-gold/5 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-tide-text">{promo.userName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-tide-muted">{promo.oldDesignation}</span>
                      <ArrowUpRight className="w-3 h-3 text-tide-gold" />
                      <span className="font-bold text-tide-text">{promo.newDesignation}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-tide-muted">{formatCurrency(promo.oldSalary)}</span>
                      <ArrowUpRight className="w-3 h-3 text-tide-gold" />
                      <span className="font-bold text-green-500">{formatCurrency(promo.newSalary)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-tide-muted">
                    {format(promo.createdAt?.toDate() || new Date(), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-tide-muted italic">
                    No promotion records found.
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
