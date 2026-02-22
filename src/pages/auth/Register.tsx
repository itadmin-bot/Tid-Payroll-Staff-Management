import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 1. Send Email Verification
      await sendEmailVerification(user);

      // 2. Create User Profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        employeeId,
        role: 'staff',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        baseSalary: 0
      });

      setSuccess('Verification email sent. Please check your inbox before logging in.');
      
      // Optional: Redirect after a delay
      setTimeout(() => navigate('/login'), 5000);
    } catch (err: any) {
      console.error("Registration error:", err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection or try a different browser.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tide-bg p-4">
      <div className="max-w-md w-full bg-tide-card rounded-2xl shadow-2xl p-8 space-y-6 border border-tide-gold/10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-tide-gold tracking-tight">Join Tidé Hotels</h1>
          <p className="text-tide-muted mt-2">Create your staff account</p>
        </div>
        
        {error && (
          <div className="bg-tide-danger/10 border-l-4 border-tide-danger p-4 text-tide-danger text-sm flex items-start gap-3 rounded-r-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border-l-4 border-green-500 p-4 text-green-500 text-sm flex items-start gap-3 rounded-r-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-tide-muted mb-1">Full Name</label>
            <input
              type="text"
              required
              className="input-field w-full"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-tide-muted mb-1">Employee ID</label>
            <input
              type="text"
              required
              placeholder="e.g. TIDE-001"
              className="input-field w-full"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-tide-muted mb-1">Email Address</label>
            <input
              type="email"
              required
              className="input-field w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@tidehotel.com"
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-tide-muted mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input-field w-full pr-12"
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

          <div className="relative">
            <label className="block text-sm font-medium text-tide-muted mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className="input-field w-full pr-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tide-muted hover:text-tide-gold transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-tide-muted">
            Already have an account? <Link to="/login" className="text-tide-gold hover:text-tide-gold-hover font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
