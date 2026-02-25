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
  enabled: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // We use a ref to store the constraints to avoid unnecessary re-runs
  // if the array is recreated but the content is the same.
  // Since we can't easily stringify QueryConstraints, we'll rely on the user
  // to memoize them if they are dynamic, or we'll just use the enabled flag.
  
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, collectionName), ...constraints);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(items);
        setLoading(false);
      }, (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      console.error(`Setup error for ${collectionName}:`, err);
      setError(err);
      setLoading(false);
    }
  }, [collectionName, enabled, JSON.stringify(constraints.map(c => c.type))]); // Fallback stability

  return { data, loading, error };
}
