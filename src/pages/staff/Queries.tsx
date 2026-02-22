import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { StaffQuery } from '../../types';
import { where, orderBy, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function StaffQueries() {
  const { profile } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data: queries } = useFirestoreCollection<StaffQuery>('queries', [
    where('userId', '==', profile?.uid || ''),
    orderBy('createdAt', 'desc')
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'queries'), {
        userId: profile.uid,
        userName: profile.displayName,
        subject,
        message,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSubject('');
      setMessage('');
      setShowForm(false);
      alert('Query submitted successfully!');
    } catch (err) {
      console.error('Error submitting query:', err);
      alert('Failed to submit query');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Queries</h1>
          <p className="text-slate-500">Submit and track your inquiries to HR</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Query
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-slate-900 mb-4">Submit New Query</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <input 
                type="text" 
                required
                className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Salary Discrepancy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Message</label>
              <textarea 
                required
                rows={4}
                className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
              />
            </div>
            <div className="flex justify-end gap-3">
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
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Query'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {queries.length > 0 ? queries.map((query) => (
          <div key={query.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  query.status === 'open' ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"
                )}>
                  {query.status === 'open' ? <Clock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{query.subject}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted on {format(query.createdAt?.toDate() || new Date(), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                query.status === 'open' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
              )}>
                {query.status}
              </span>
            </div>
            
            <div className="mt-4 p-4 bg-slate-50 rounded-xl text-sm text-slate-700">
              {query.message}
            </div>

            {query.response && (
              <div className="mt-4 p-4 bg-primary-50 rounded-xl border-l-4 border-primary-500">
                <p className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-2">HR Response</p>
                <p className="text-sm text-slate-800">{query.response}</p>
                <p className="text-[10px] text-slate-500 mt-2">
                  Replied on {format(query.updatedAt?.toDate() || new Date(), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        )) : (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No queries submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
