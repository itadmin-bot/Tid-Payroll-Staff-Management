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
  AlertCircle
} from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { UserProfile } from '../../types';
import { orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StaffManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: staff, loading } = useFirestoreCollection<UserProfile>('users', [
    orderBy('createdAt', 'desc')
  ]);

  const handleStatusChange = async (userId: string, newStatus: UserProfile['status']) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tide-text">Staff Management</h1>
          <p className="text-tide-muted mt-1">Manage employee accounts and approvals</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tide-muted" />
            <input 
              type="text" 
              placeholder="Search staff..."
              className="input-field w-full md:w-64 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 bg-tide-card border border-tide-gold/10 rounded-xl text-tide-gold hover:bg-tide-gold/10 transition-all">
            <Filter className="w-5 h-5" />
          </button>
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
                      <div className="w-10 h-10 rounded-full bg-tide-bg border border-tide-gold/20 flex items-center justify-center font-bold text-tide-gold">
                        {member.displayName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-tide-text">{member.displayName}</p>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
