import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  CheckCircle2, 
  Clock, 
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { 
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export default function VerifyEmail() {
  const { user, logout, refreshUser } = useAuth();
  const [timer, setTimer] = useState(300); // 5 minutes
  const [isVerified, setIsVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const checkVerification = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setIsVerified(true);
        
        // Check for pending admin registration
        const pendingAdmin = localStorage.getItem('pendingAdminRegistration');
        if (pendingAdmin) {
          try {
            const adminData = JSON.parse(pendingAdmin);
            const response = await fetch('/api/assignAdminRole', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: auth.currentUser?.uid,
                ...adminData
              })
            });
            const result = await response.json();
            if (result.success) {
              localStorage.removeItem('pendingAdminRegistration');
            }
          } catch (err) {
            console.error('Error processing pending admin:', err);
          }
        }

        await refreshUser();
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      console.error('Error checking verification:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.emailVerified) {
      setIsVerified(true);
      setTimeout(() => navigate('/dashboard'), 2000);
      return;
    }

    const interval = setInterval(() => {
      if (timer > 0 && !isVerified) {
        setTimer((prev) => prev - 1);
        
        // Check verification status every 5 seconds automatically
        if (timer % 5 === 0) {
          checkVerification();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, timer, isVerified, navigate, refreshUser]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResend = async () => {
    if (!auth.currentUser || resendTimer > 0) return;
    
    setResendLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResendTimer(60); // Wait 60 seconds before next resend
      setTimer(300); // Reset main timer
    } catch (err) {
      console.error('Error resending verification:', err);
      alert('Failed to resend verification email. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-tide-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-luxury max-w-md w-full p-8 text-center space-y-8"
      >
        <div className="inline-flex p-4 rounded-full bg-tide-gold/10 border border-tide-gold/20">
          {isVerified ? (
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
          ) : (
            <Mail className="w-16 h-16 text-tide-gold animate-pulse" />
          )}
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-tide-text">
            {isVerified ? 'Email Verified!' : 'Verify Your Email'}
          </h1>
          <p className="text-tide-muted">
            {isVerified 
              ? 'Success! Redirecting you to your dashboard...' 
              : `We've sent a verification link to ${user.email}. Please click the link to activate your account.`}
          </p>
        </div>

        {!isVerified && (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "flex items-center gap-2 text-3xl font-mono font-bold px-8 py-4 rounded-2xl border shadow-inner transition-colors",
                timer > 0 ? "text-tide-gold bg-tide-bg border-tide-gold/20" : "text-tide-danger bg-tide-danger/5 border-tide-danger/20"
              )}>
                <Clock className="w-8 h-8" />
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-[10px] text-tide-muted uppercase tracking-widest font-bold">
                {timer > 0 ? 'Link Expiration Countdown' : 'Verification Link Expired'}
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <button
                onClick={checkVerification}
                disabled={checking || timer === 0}
                className="w-full py-3 rounded-xl font-bold bg-tide-gold text-tide-bg hover:bg-tide-gold-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                I've Verified My Email
              </button>

              <button
                onClick={handleResend}
                disabled={resendLoading || resendTimer > 0}
                className={cn(
                  "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                  resendTimer > 0 
                    ? "bg-tide-muted/10 text-tide-muted border border-tide-muted/20 cursor-not-allowed"
                    : "bg-tide-gold/10 text-tide-gold border border-tide-gold/20 hover:bg-tide-gold/20"
                )}
              >
                {resendLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : timer === 0 ? 'Resend New Link' : 'Resend Verification Email'}
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 text-tide-muted hover:text-tide-danger transition-colors text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Sign out and try again
              </button>
            </div>
          </>
        )}

        <div className="pt-6 border-t border-tide-gold/10">
          <div className="flex items-center justify-center gap-2 text-xs text-tide-muted">
            <AlertCircle className="w-4 h-4" />
            <span>Didn't receive the email? Check your spam folder.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
