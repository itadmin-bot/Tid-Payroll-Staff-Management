import { 
  Database, 
  UserPlus, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useState } from 'react';

export default function SeedData() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const seedData = async () => {
    setLoading(true);
    try {
      // Check if already seeded
      const q = query(collection(db, 'users'), limit(1));
      const snapshot = await getDocs(q);
      
      // We only seed if there's only 1 user (the admin who is logged in)
      // For this demo, we'll just proceed if the user confirms
      if (!confirm('This will add 3 dummy staff members and sample data. Continue?')) {
        setLoading(false);
        return;
      }

      const dummyStaff = [
        {
          displayName: 'John Doe',
          email: 'john@tidehotel.com',
          employeeId: 'TIDE-002',
          role: 'staff',
          status: 'active',
          department: 'Kitchen',
          designation: 'Head Chef',
          baseSalary: 250000,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          displayName: 'Jane Smith',
          email: 'jane@tidehotel.com',
          employeeId: 'TIDE-003',
          role: 'staff',
          status: 'active',
          department: 'Front Desk',
          designation: 'Reception Manager',
          baseSalary: 180000,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          displayName: 'Samuel Okon',
          email: 'samuel@tidehotel.com',
          employeeId: 'TIDE-004',
          role: 'staff',
          status: 'pending',
          department: 'Housekeeping',
          designation: 'Supervisor',
          baseSalary: 120000,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      for (const staff of dummyStaff) {
        await addDoc(collection(db, 'users'), staff);
      }

      // Add a sample query
      await addDoc(collection(db, 'queries'), {
        userId: 'dummy-id',
        userName: 'John Doe',
        subject: 'Leave Allowance',
        message: 'I would like to inquire about the leave allowance for this year.',
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setDone(true);
      alert('Dummy data seeded successfully!');
    } catch (err) {
      console.error('Error seeding data:', err);
      alert('Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  return (
    <div className="bg-primary-50 border border-primary-200 p-4 rounded-xl flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <Database className="w-5 h-5 text-primary-600" />
        <div>
          <p className="text-sm font-bold text-primary-900">Database Empty?</p>
          <p className="text-xs text-primary-700">Seed dummy staff data to test the system features.</p>
        </div>
      </div>
      <button 
        onClick={seedData}
        disabled={loading}
        className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
      >
        {loading ? 'Seeding...' : 'Seed Dummy Data'}
      </button>
    </div>
  );
}
