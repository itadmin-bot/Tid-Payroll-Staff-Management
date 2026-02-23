import React, { useState } from 'react';
import { Activity, Search, Filter, Clock, User, Shield, ArrowDownAz, ArrowUpAz } from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { ActivityLog } from '../../types';
import { orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: logs, loading } = useFirestoreCollection<ActivityLog>('activities', [
    orderBy('createdAt', 'desc'),
    limit(100)
  ]);

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.performedByName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tide-text">Audit Trail</h1>
          <p className="text-tide-muted mt-1">System-wide activity monitoring and security logs</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tide-muted" />
          <input 
            type="text" 
            placeholder="Search logs by action, user or details..."
            className="input-field w-full pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-tide-bg/50 border-b border-tide-gold/10">
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Performed By</th>
                <th className="px-6 py-4 text-[10px] font-bold text-tide-muted uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tide-gold/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-tide-muted">
                    <Clock className="w-8 h-8 mx-auto mb-2 animate-spin opacity-20" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-tide-gold/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-tide-text">
                        <Clock className="w-3 h-3 text-tide-gold" />
                        {format(log.createdAt?.toDate() || new Date(), 'MMM dd, yyyy • HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                        log.action.includes('REGISTERED') ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        log.action.includes('DELETED') || log.action.includes('SUSPENDED') ? "bg-tide-danger/10 text-tide-danger border-tide-danger/20" :
                        "bg-tide-gold/10 text-tide-gold border-tide-gold/20"
                      )}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-tide-bg border border-tide-gold/20 flex items-center justify-center text-[10px] font-bold text-tide-gold">
                          {log.performedByName?.charAt(0) || 'S'}
                        </div>
                        <span className="text-sm font-medium text-tide-text">{log.performedByName || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-tide-muted line-clamp-1" title={log.details}>
                        {log.details}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-tide-muted">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>No activity logs found matching your search</p>
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
