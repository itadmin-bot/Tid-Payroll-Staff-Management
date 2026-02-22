import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { UserProfile, Promotion } from '../../types';
import { orderBy, doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';

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
          <h1 className="text-2xl font-bold text-slate-900">Promotions & Growth</h1>
          <p className="text-slate-500">Manage staff career advancement and salary adjustments</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Promotion
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-slate-900 mb-4">Process New Promotion</h3>
          <form onSubmit={handlePromote} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Select Staff</label>
              <select 
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
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
              <label className="text-sm font-semibold text-slate-700">New Designation</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                placeholder="e.g. Senior Manager"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">New Base Salary (Monthly)</label>
              <input 
                type="number" 
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                placeholder="e.g. 350000"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                {isSubmitting ? 'Processing...' : 'Confirm Promotion'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role Change</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Salary Change</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promotions.map((promo) => (
              <tr key={promo.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{promo.userName}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">{promo.oldDesignation}</span>
                    <ArrowUpRight className="w-3 h-3 text-primary-500" />
                    <span className="font-bold text-slate-900">{promo.newDesignation}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">{formatCurrency(promo.oldSalary)}</span>
                    <ArrowUpRight className="w-3 h-3 text-primary-500" />
                    <span className="font-bold text-green-600">{formatCurrency(promo.newSalary)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {format(promo.createdAt?.toDate() || new Date(), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  No promotion records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
