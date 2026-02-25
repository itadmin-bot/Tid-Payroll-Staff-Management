import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  ShieldAlert,
  Trash2,
  Mail,
  RefreshCw
} from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { UserProfile } from '../../types';
import { orderBy, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function StaffManagement() {
  const navigate = useNavigate();
  const { user: currentUser, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const constraints = useMemo(() => [
    orderBy('createdAt', 'desc')
  ], []);

  const { data: staff, loading, error } = useFirestoreCollection<UserProfile>('users', constraints, !!currentUser);

  const handleStatusChange = async (userId: string, newStatus: UserProfile['status']) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleRoleChange = async (targetUid: string, newRole: string) => {
    if (!currentUser) return;
    if (targetUid === currentUser.uid) {
      alert("You cannot change your own role.");
      return;
    }

    setIsProcessing(targetUid);
    try {
      const response = await fetch('/api/changeUserRole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          targetUid,
          newRole
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      alert(`Role successfully changed to ${newRole}`);
    } catch (err: any) {
      alert(err.message || 'Failed to change role');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteUser = async (targetUid: string) => {
    if (!currentUser) return;
    if (targetUid === currentUser.uid) {
      alert("You cannot delete yourself.");
      return;
    }

    if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;

    setIsProcessing(targetUid);
    try {
      const response = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          targetUid
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      alert('User successfully deleted');
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = 
      s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tide-text">Staff Management</h1>
          <p className="text-tide-muted mt-1">Manage employee accounts and approvals</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tide-muted" />
            <input 
              type="text" 
              placeholder="Search staff..."
              className="input-field w-full md:w-64 pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="input-field bg-tide-card border-tide-gold/10 text-tide-text"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-luxury p-6">
          <p className="text-[10px] font-bold text-tide-muted uppercase tracking-widest">Total Staff</p>
          <p className="text-2xl font-bold text-tide-text mt-2">{staff.length}</p>
        </div>
        <div className="card-luxury p-6 border-l-4 border-l-tide-gold">
          <p className="text-[10px] font-bold text-tide-muted uppercase tracking-widest">Pending</p>
          <p className="text-2xl font-bold text-tide-gold mt-2">
            {staff.filter(s => s.status === 'pending').length}
          </p>
        </div>
        <div className="card-luxury p-6 border-l-4 border-l-green-500">
          <p className="text-[10px] font-bold text-tide-muted uppercase tracking-widest">Active</p>
          <p className="text-2xl font-bold text-green-500 mt-2">
            {staff.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="card-luxury p-6 border-l-4 border-l-tide-danger">
          <p className="text-[10px] font-bold text-tide-muted uppercase tracking-widest">Suspended</p>
          <p className="text-2xl font-bold text-tide-danger mt-2">
            {staff.filter(s => s.status === 'suspended').length}
          </p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card-luxury overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-tide-gold animate-spin" />
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-tide-danger mx-auto opacity-50" />
            <p className="text-tide-text font-medium">Error loading staff data</p>
            <p className="text-xs text-tide-muted">{error.message}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-tide-bg/50 border-b border-tide-gold/10">
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Role & Dept</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Salary</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tide-gold/5">
              {filteredStaff.map((member) => (
                <tr 
                  key={member.id} 
                  className="hover:bg-tide-gold/5 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/admin/staff/${member.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-tide-bg border border-tide-gold/20 flex items-center justify-center font-bold text-tide-gold">
                          {member.displayName?.charAt(0)}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-tide-bg",
                          member.isOnline ? "bg-green-500" : "bg-tide-muted"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-tide-text">{member.displayName}</p>
                          {member.role === 'admin' && <Shield className="w-3 h-3 text-tide-gold" />}
                        </div>
                        <p className="text-[10px] text-tide-muted uppercase tracking-wider">{member.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-tide-text capitalize">{member.role}</p>
                    <p className="text-xs text-tide-muted">{member.department || 'Unassigned'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-tide-gold">{formatCurrency(member.baseSalary || 0)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                      member.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                      member.status === 'pending' ? "bg-tide-gold/10 text-tide-gold border-tide-gold/20" :
                      "bg-tide-danger/10 text-tide-danger border-tide-danger/20"
                    )}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {isProcessing === member.id ? (
                        <RefreshCw className="w-5 h-5 text-tide-gold animate-spin" />
                      ) : (
                        <>
                          {member.status === 'pending' && (
                            <button 
                              onClick={() => handleStatusChange(member.id, 'active')}
                              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {member.status === 'active' && (
                            <button 
                              onClick={() => handleStatusChange(member.id, 'suspended')}
                              className="p-2 text-tide-danger hover:bg-tide-danger/10 rounded-lg transition-all"
                              title="Suspend"
                            >
                              <AlertCircle className="w-5 h-5" />
                            </button>
                          )}
                          {member.status === 'suspended' && (
                            <button 
                              onClick={() => handleStatusChange(member.id, 'active')}
                              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                              title="Reactivate"
                            >
                              <UserCheck className="w-5 h-5" />
                            </button>
                          )}
                          
                          {member.role === 'staff' ? (
                            <button 
                              onClick={() => handleRoleChange(member.id, 'admin')}
                              className="p-2 text-tide-gold hover:bg-tide-gold/10 rounded-lg transition-all"
                              title="Promote to Admin"
                            >
                              <Shield className="w-5 h-5" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleRoleChange(member.id, 'staff')}
                              className="p-2 text-tide-muted hover:bg-tide-gold/10 rounded-lg transition-all"
                              title="Demote to Staff"
                            >
                              <ShieldAlert className="w-5 h-5" />
                            </button>
                          )}

                          <button 
                            onClick={() => handleDeleteUser(member.id)}
                            className="p-2 text-tide-danger hover:bg-tide-danger/10 rounded-lg transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
