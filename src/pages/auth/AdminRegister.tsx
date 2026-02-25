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
  const navigate = useNavigate();

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
      
      // 2. Store pending admin data for VerifyEmail page
      localStorage.setItem('pendingAdminRegistration', JSON.stringify({
        accessCode,
        fullName,
        email
      }));

      // 3. Send Verification Email
      await sendEmailVerification(userCredential.user);
      
      // App.tsx will automatically redirect to /verify-email
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
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted group-focus-within:text-tide-gold transition-colors" />
              <input 
                type="text"
                required
                className="input-field w-full !pl-12"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted group-focus-within:text-tide-gold transition-colors" />
              <input 
                type="email"
                required
                className="input-field w-full !pl-12"
                placeholder="admin@tidehotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted group-focus-within:text-tide-gold transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field w-full !pl-12 !pr-12"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tide-muted hover:text-tide-gold transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Confirm</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted group-focus-within:text-tide-gold transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field w-full !pl-12 !pr-12"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tide-muted hover:text-tide-gold transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">Admin Access Code</label>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted group-focus-within:text-tide-gold transition-colors" />
              <input 
                type="text"
                required
                className="input-field w-full !pl-12 border-tide-gold/30 focus:border-tide-gold"
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
    </div>
  );
}
