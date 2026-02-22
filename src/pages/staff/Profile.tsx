import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  CreditCard,
  Save,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export default function Profile() {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    phoneNumber: profile?.phoneNumber || '',
    bankName: profile?.bankName || '',
    accountNumber: profile?.accountNumber || '',
    department: profile?.department || '',
    designation: profile?.designation || ''
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500">Manage your personal and professional information</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold mx-auto mb-4">
              {profile?.displayName?.charAt(0)}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{profile?.displayName}</h3>
            <p className="text-sm text-slate-500">{profile?.employeeId}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              {profile?.role}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4">Account Status</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-green-600 capitalize">{profile?.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Joined</span>
                <span className="font-medium text-slate-900">
                  {profile?.createdAt ? new Date(profile.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdate} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Full Name
                </label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition disabled:opacity-60"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Email Address
                </label>
                <input 
                  type="email" 
                  disabled
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none opacity-60"
                  value={profile?.email}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> Phone Number
                </label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition disabled:opacity-60"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" /> Department
                </label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition disabled:opacity-60"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" /> Designation
                </label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition disabled:opacity-60"
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-6">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-400" /> Banking Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Bank Name</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition disabled:opacity-60"
                    value={formData.bankName}
                    onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Account Number</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition disabled:opacity-60"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition shadow-lg disabled:opacity-50 font-bold"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
