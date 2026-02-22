import { 
  MessageSquare, 
  CheckCircle2,
  Clock,
  Reply,
  Search
} from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { StaffQuery } from '../../types';
import { orderBy, doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { format } from 'date-fns';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export default function AdminQueries() {
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<{ [key: string]: boolean }>({});

  const { data: queries } = useFirestoreCollection<StaffQuery>('queries', [
    orderBy('createdAt', 'desc')
  ]);

  const handleReply = async (queryId: string, userId: string) => {
    const text = replyText[queryId];
    if (!text) return;

    setIsSubmitting({ ...isSubmitting, [queryId]: true });
    try {
      await updateDoc(doc(db, 'queries', queryId), {
        response: text,
        status: 'resolved',
        updatedAt: serverTimestamp()
      });

      // Notify user
      await addDoc(collection(db, 'notifications'), {
        userId,
        title: 'Query Resolved',
        message: 'HR has responded to your query.',
        read: false,
        type: 'query',
        createdAt: serverTimestamp()
      });

      setReplyText({ ...replyText, [queryId]: '' });
      alert('Reply sent successfully!');
    } catch (err) {
      console.error('Error replying to query:', err);
      alert('Failed to send reply');
    } finally {
      setIsSubmitting({ ...isSubmitting, [queryId]: false });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Staff Queries</h1>
        <p className="text-slate-500">Manage and respond to employee inquiries</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {queries.length > 0 ? queries.map((query) => (
          <div key={query.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                  {query.userName?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{query.subject}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    From <span className="font-semibold text-slate-700">{query.userName}</span> • {format(query.createdAt?.toDate() || new Date(), 'MMM d, h:mm a')}
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

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700">
                {query.message}
              </div>

              {query.response ? (
                <div className="p-4 bg-primary-50 rounded-xl border-l-4 border-primary-500">
                  <p className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-2">Your Response</p>
                  <p className="text-sm text-slate-800">{query.response}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
                    placeholder="Type your response here..."
                    value={replyText[query.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [query.id]: e.target.value })}
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleReply(query.id, query.userId)}
                      disabled={isSubmitting[query.id] || !replyText[query.id]}
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 shadow-sm"
                    >
                      <Reply className="w-4 h-4" />
                      {isSubmitting[query.id] ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No queries found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
