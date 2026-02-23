import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        setNeedsVerification(true);
        setError('Please verify your email before accessing the system.');
        // Sign out immediately to prevent access
        await signOut(auth);
        return;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    // This is tricky because we just signed them out.
    // In a real app, you might want a separate "Resend Verification" page
    // or keep them signed in but restricted.
    setError('To resend verification, please try to register again or contact support.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tide-bg p-4">
      <div className="max-w-md w-full bg-tide-card rounded-2xl shadow-2xl p-8 space-y-6 border border-tide-gold/10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-tide-gold tracking-tight">Tidé Hotels</h1>
          <p className="text-tide-muted mt-2">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="bg-tide-danger/10 border-l-4 border-tide-danger p-4 text-tide-danger text-sm flex items-start gap-3 rounded-r-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex flex-col gap-2">
              <span>{error}</span>
              {needsVerification && (
                <button 
                  onClick={handleResendVerification}
                  className="text-xs font-bold hover:underline text-left"
                >
                  Resend verification email?
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-tide-muted">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted group-focus-within:text-tide-gold transition-colors" />
              <input
                type="email"
                required
                className="input-field w-full !pl-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@tidehotel.com"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-tide-muted">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted group-focus-within:text-tide-gold transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input-field w-full !pl-12 !pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tide-muted hover:text-tide-gold transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <button 
            type="button"
            className="text-sm text-tide-gold hover:text-tide-gold-hover transition-colors"
          >
            Forgot your password?
          </button>
          <p className="text-sm text-tide-muted">
            Don't have an account? <Link to="/register" className="text-tide-gold hover:text-tide-gold-hover font-semibold transition-colors">Register here</Link>
          </p>
          <div className="pt-4 border-t border-tide-gold/10">
            <p className="text-xs text-tide-muted">
              Are you an administrator? <Link to="/admin/register" className="text-tide-gold hover:underline font-bold">Register as Admin</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
