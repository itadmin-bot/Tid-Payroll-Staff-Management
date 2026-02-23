import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  CreditCard, 
  Calendar, 
  Award, 
  History, 
  ChevronLeft,
  Edit3,
  Save,
  X,
  DollarSign
} from 'lucide-react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { UserProfile } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

export default function StaffProfile() {
  const { id } = useParams<{ id: string }>();
  const { profile: currentUser } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const isAdmin = currentUser?.role === 'admin';
  const isOwnProfile = currentUser?.uid === id;
  const canEdit = isAdmin || isOwnProfile;

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'users', id), (doc) => {
      if (doc.exists()) {
        const data = { ...doc.data(), uid: doc.id } as UserProfile;
        setMember(data);
        setFormData(data);
      } else {
        navigate(isAdmin ? '/admin/staff' : '/dashboard');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate, isAdmin]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      // Only admins can update sensitive fields
      const updateData = isAdmin ? formData : {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber
      };

      await updateDoc(doc(db, 'users', id), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-tide-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-tide-muted hover:text-tide-gold transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        {canEdit && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all",
              isEditing 
                ? "bg-tide-danger/10 text-tide-danger border border-tide-danger/20 hover:bg-tide-danger/20" 
                : "bg-tide-gold text-tide-bg hover:bg-tide-gold-hover shadow-lg"
            )}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        )}
      </div>

      {/* Profile Hero */}
      <div className="card-luxury p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-tide-bg border-2 border-tide-gold/30 flex items-center justify-center text-4xl font-bold text-tide-gold shadow-2xl shadow-tide-gold/10">
            {member.displayName?.charAt(0)}
          </div>
          <div className={cn(
            "absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-tide-card",
            member.status === 'active' ? "bg-green-500" : "bg-tide-danger"
          )}></div>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-3xl font-bold text-tide-text">{member.displayName}</h1>
            <span className="px-3 py-1 bg-tide-gold/10 text-tide-gold text-[10px] font-bold uppercase tracking-widest rounded-full border border-tide-gold/20">
              {member.role}
            </span>
          </div>
          <p className="text-tide-muted mt-2 flex items-center justify-center md:justify-start gap-2">
            <Briefcase className="w-4 h-4 text-tide-gold" />
            {member.designation || 'Position Not Set'} • {member.department || 'Department Not Set'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 text-sm text-tide-muted">
              <Mail className="w-4 h-4" /> {member.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-tide-muted">
              <Phone className="w-4 h-4" /> {member.phoneNumber || 'No Phone'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="bg-tide-bg/50 p-4 rounded-2xl border border-tide-gold/5 text-center">
            <p className="text-[10px] text-tide-muted uppercase tracking-widest">Employee ID</p>
            <p className="text-lg font-bold text-tide-text mt-1">{member.employeeId}</p>
          </div>
          <div className="bg-tide-bg/50 p-4 rounded-2xl border border-tide-gold/5 text-center">
            <p className="text-[10px] text-tide-muted uppercase tracking-widest">Base Salary</p>
            <p className="text-lg font-bold text-tide-gold mt-1">{formatCurrency(member.baseSalary)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal & Employment */}
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
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Email Address</label>
                <input 
                  type="email"
                  disabled
                  className="input-field w-full opacity-50 cursor-not-allowed"
                  value={member.email}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Phone Number</label>
                <input 
                  type="text"
                  disabled={!isEditing}
                  className="input-field w-full disabled:opacity-50"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Joined Date</label>
                <div className="input-field w-full opacity-50 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-tide-gold" />
                  {member.createdAt ? format(member.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                </div>
              </div>
            </div>
          </section>

          {/* Employment Details */}
          <section className="card-luxury p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-tide-gold/10 pb-4">
              <Building className="w-5 h-5 text-tide-gold" />
              <h3 className="text-xl font-bold text-tide-text">Employment Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Department</label>
                <input 
                  type="text"
                  disabled={!isEditing || !isAdmin}
                  className="input-field w-full disabled:opacity-50"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Designation</label>
                <input 
                  type="text"
                  disabled={!isEditing || !isAdmin}
                  className="input-field w-full disabled:opacity-50"
                  value={formData.designation || ''}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Employment Status</label>
                <select 
                  disabled={!isEditing || !isAdmin}
                  className="input-field w-full disabled:opacity-50"
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Base Salary (Monthly)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tide-gold" />
                  <input 
                    type="number"
                    disabled={!isEditing || !isAdmin}
                    className="input-field w-full pl-10 disabled:opacity-50"
                    value={formData.baseSalary || 0}
                    onChange={(e) => setFormData({...formData, baseSalary: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Job History (Mocked) */}
          <section className="card-luxury p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-tide-gold/10 pb-4">
              <History className="w-5 h-5 text-tide-gold" />
              <h3 className="text-xl font-bold text-tide-text">Job History</h3>
            </div>
            
            <div className="space-y-6">
              {[
                { role: member.designation || 'Current Role', date: 'Jan 2024 - Present', type: 'Promotion' },
                { role: 'Junior Associate', date: 'Jun 2022 - Dec 2023', type: 'Initial Hire' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== 1 && <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-tide-gold/20"></div>}
                  <div className="w-8 h-8 rounded-full bg-tide-bg border border-tide-gold/20 flex items-center justify-center shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-tide-gold"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-tide-text">{item.role}</p>
                      <span className="text-[10px] font-bold text-tide-gold uppercase tracking-widest bg-tide-gold/10 px-2 py-0.5 rounded-full">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-tide-muted mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Payroll & Reviews */}
        <div className="space-y-8">
          {/* Payroll Information */}
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
                  value={formData.bankName || ''}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  placeholder="e.g. Zenith Bank"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Account Number</label>
                <input 
                  type="text"
                  disabled={!isEditing}
                  className="input-field w-full disabled:opacity-50"
                  value={formData.accountNumber || ''}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  placeholder="10-digit account number"
                />
              </div>
            </div>
          </section>

          {/* Performance Reviews (Mocked) */}
          <section className="card-luxury p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-tide-gold/10 pb-4">
              <Award className="w-5 h-5 text-tide-gold" />
              <h3 className="text-xl font-bold text-tide-text">Performance</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { period: 'Q4 2023', rating: 'Exceeds Expectations', score: '4.8/5.0' },
                { period: 'Q3 2023', rating: 'Meets Expectations', score: '4.2/5.0' }
              ].map((review, i) => (
                <div key={i} className="p-4 bg-tide-bg/50 rounded-xl border border-tide-gold/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-tide-gold">{review.period}</span>
                    <span className="text-[10px] font-bold text-tide-text bg-tide-gold/20 px-2 py-0.5 rounded-full">{review.score}</span>
                  </div>
                  <p className="text-sm font-semibold text-tide-text">{review.rating}</p>
                </div>
              ))}
            </div>
            {isAdmin && (
              <button className="w-full py-2 text-xs font-bold text-tide-gold hover:bg-tide-gold/10 border border-tide-gold/20 rounded-lg transition-all">
                Schedule Review
              </button>
            )}
          </section>

          {/* Save Button (Floating/Visible when editing) */}
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-4"
            >
              <button 
                type="submit"
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 shadow-2xl shadow-tide-gold/20"
              >
                <Save className="w-5 h-5" />
                Save All Changes
              </button>
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
}
