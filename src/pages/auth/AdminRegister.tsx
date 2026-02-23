import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  deleteUser,
  signOut
} from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminRegister() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [isVerified, setIsVerified] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showVerificationModal && timer > 0 && !isVerified) {
      interval = setInterval(async () => {
        setTimer((prev) => prev - 1);
        
        // Check verification status every 5 seconds
        if (timer % 5 === 0) {
          if (auth.currentUser) {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
              setIsVerified(true);
              handleVerificationSuccess();
            }
          }
        }
      }, 1000);
    } else if (timer === 0 && !isVerified) {
      handleVerificationExpired();
    }
    return () => clearInterval(interval);
  }, [showVerificationModal, timer, isVerified]);

  const handleVerificationSuccess = async () => {
    try {
      // Call backend to assign role
      const response = await fetch('/api/assignAdminRole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: auth.currentUser?.uid,
          accessCode,
          fullName,
          email
        })
      });

      const data = await response.json();
      if (data.success) {
        await refreshUser();
        setTimeout(() => {
          setShowVerificationModal(false);
          navigate('/admin');
        }, 2000);
      } else {
        setError(data.error || 'Failed to assign admin role');
        setShowVerificationModal(false);
        // If role assignment fails, we might need to delete the user or handle it
      }
    } catch (err) {
      console.error('Error in verification success:', err);
      setError('An error occurred during final setup');
    }
  };

  const handleVerificationExpired = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await deleteUser(auth.currentUser);
      await signOut(auth);
      alert('Verification expired. Please register again.');
      setShowVerificationModal(false);
      navigate('/admin/register');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!accessCode) {
      setError('Admin Access Code is required');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Send Verification Email
      await sendEmailVerification(userCredential.user);
      
      // 3. Show Modal
      setShowVerificationModal(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else {
        setError(err.message || 'Failed to register');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tide-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-tide-gold/10 border border-tide-gold/20 mb-4">
            <ShieldCheck className="w-10 h-10 text-tide-gold" />
          </div>
          <h1 className="text-3xl font-bold text-tide-text">Admin Registration</h1>
          <p className="text-tide-muted mt-2">Create a secure administrator account</p>
        </div>

        <form onSubmit={handleRegister} className="card-luxury p-8 space-y-6">
          {error && (
            <div className="p-4 bg-tide-danger/10 border border-tide-danger/20 rounded-xl flex items-center gap-3 text-tide-danger text-sm">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted" />
              <input 
                type="text"
                required
                className="input-field w-full pl-10"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted" />
              <input 
                type="email"
                required
                className="input-field w-full pl-10"
                placeholder="admin@tidehotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field w-full pl-10"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Confirm</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field w-full pl-10"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Admin Access Code</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted" />
              <input 
                type="text"
                required
                className="input-field w-full pl-10 border-tide-gold/30 focus:border-tide-gold"
                placeholder="TIDE-ADMIN-XXXX-XXXX"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-tide-gold/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            Register as Admin
          </button>

          <p className="text-center text-sm text-tide-muted">
            Already have an account? <Link to="/login" className="text-tide-gold hover:underline">Login</Link>
          </p>
        </form>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tide-bg/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card-luxury max-w-md w-full p-8 text-center space-y-6"
            >
              <div className="inline-flex p-4 rounded-full bg-tide-gold/10 border border-tide-gold/20">
                {isVerified ? (
                  <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
                ) : (
                  <Mail className="w-12 h-12 text-tide-gold animate-pulse" />
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-tide-text">
                  {isVerified ? 'Email Verified!' : 'Verify Your Email'}
                </h2>
                <p className="text-tide-muted mt-2">
                  {isVerified 
                    ? 'Setting up your admin account...' 
                    : `A verification link has been sent to ${email}. Please verify within 5 minutes.`}
                </p>
              </div>

              {!isVerified && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-2xl font-mono font-bold text-tide-gold bg-tide-bg px-6 py-3 rounded-xl border border-tide-gold/20">
                    <Clock className="w-6 h-6" />
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </div>
                  <p className="text-[10px] text-tide-muted uppercase tracking-widest">Time Remaining</p>
                </div>
              )}

              <div className="pt-4">
                <p className="text-xs text-tide-muted">
                  Checking status automatically...
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
