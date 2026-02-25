import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export function useFirestoreCollection<T>(
  collectionName: string, 
  constraints: QueryConstraint[] = [],
  enabled: boolean = true,
  sortConfig?: { field: keyof T; direction: 'asc' | 'desc' }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Filter out orderBy constraints if they would cause index issues
      // In this app, we'll favor client-side sorting for collections filtered by userId
      const hasWhere = constraints.some(c => c.type === 'where');
      const filteredConstraints = hasWhere 
        ? constraints.filter(c => c.type !== 'orderBy')
        : constraints;

      const q = query(collection(db, collectionName), ...filteredConstraints);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });

        // Apply client-side sorting if requested or if we removed orderBy
        const sortField = sortConfig?.field || (constraints.find(c => c.type === 'orderBy') as any)?._field;
        const sortDir = sortConfig?.direction || (constraints.find(c => c.type === 'orderBy') as any)?._direction || 'desc';

        if (sortField) {
          items.sort((a: any, b: any) => {
            const valA = a[sortField] instanceof Date ? a[sortField].getTime() : a[sortField]?.seconds || a[sortField];
            const valB = b[sortField] instanceof Date ? b[sortField].getTime() : b[sortField]?.seconds || b[sortField];
            
            if (sortDir === 'asc') {
              return valA > valB ? 1 : -1;
            } else {
              return valA < valB ? 1 : -1;
            }
          });
        }

        setData(items);
        setLoading(false);
      }, (err) => {
        console.error(`Firestore onSnapshot error for ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      console.error(`Firestore query setup error for ${collectionName}:`, err);
      setError(err);
      setLoading(false);
    }
  }, [collectionName, enabled, JSON.stringify(constraints.map(c => ({ type: c.type, field: (c as any)._field }))), JSON.stringify(sortConfig)]);

  return { data, loading, error };
}
