import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  getIdTokenResult
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  role: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const checkClaims = async (firebaseUser: User) => {
    try {
      const tokenResult = await getIdTokenResult(firebaseUser, true);
      setRole((tokenResult.claims.role as string) || null);
    } catch (error) {
      console.error("Error checking claims:", error);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await checkClaims(firebaseUser);
        
        // Update online status using setDoc with merge to avoid "No document to update" error
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          isOnline: true,
          lastActive: serverTimestamp()
        }, { merge: true }).catch(console.error);

        // Real-time profile listener
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid), 
          (snapshot) => {
            if (snapshot.exists()) {
              setProfile({ ...snapshot.data(), uid: snapshot.id } as UserProfile);
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching profile:", error);
            setLoading(false);
          }
        );
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = undefined;
        }
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      
      // Update offline status on cleanup if we have a user
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), {
          isOnline: false,
          lastActive: serverTimestamp()
        }, { merge: true }).catch(console.error);
      }
    };
  }, []);

  const logout = async () => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), {
        isOnline: false,
        lastActive: serverTimestamp()
      }, { merge: true }).catch(console.error);
    }
    await firebaseSignOut(auth);
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await checkClaims(auth.currentUser);
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: role === 'admin',
    role,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
