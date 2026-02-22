import { 
  TrendingUp, 
  Award, 
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { Promotion } from '../../types';
import { where, orderBy } from 'firebase/firestore';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

export default function StaffPromotions() {
  const { profile } = useAuth();
  
  const { data: promotions } = useFirestoreCollection<Promotion>('promotions', [
    where('userId', '==', profile?.uid || ''),
    orderBy('createdAt', 'desc')
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career Growth</h1>
        <p className="text-slate-500">Track your promotions and career milestones at Tidé Hotels</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {promotions.length > 0 ? promotions.map((promo) => (
          <div key={promo.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Promotion Announcement</h3>
                  <p className="text-primary-100 text-sm">Effective: {format(promo.effectiveDate?.toDate() || new Date(), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              <TrendingUp className="w-12 h-12 opacity-20" />
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role Change</p>
                <div className="flex items-center gap-4">
                  <div className="text-slate-500 line-through text-sm">{promo.oldDesignation}</div>
                  <ArrowUpRight className="w-4 h-4 text-primary-500" />
                  <div className="text-lg font-bold text-slate-900">{promo.newDesignation}</div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Salary Adjustment</p>
                <div className="flex items-center gap-4">
                  <div className="text-slate-500 line-through text-sm">{formatCurrency(promo.oldSalary)}</div>
                  <ArrowUpRight className="w-4 h-4 text-primary-500" />
                  <div className="text-lg font-bold text-green-600">{formatCurrency(promo.newSalary)}</div>
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-4 h-4" />
              Recorded on {format(promo.createdAt?.toDate() || new Date(), 'MMMM d, yyyy')}
            </div>
          </div>
        )) : (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No promotion records found yet. Keep up the great work!</p>
          </div>
        )}
      </div>
    </div>
  );
}
