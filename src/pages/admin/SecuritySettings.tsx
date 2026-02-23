import React, { useState, useEffect } from 'react';
import { Shield, Key, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export default function SecuritySettings() {
  const { user } = useAuth();
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        setCurrentCode(doc.data().adminAccessCode);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newCode) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/updateAccessCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUid: user.uid,
          newCode
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Admin Access Code updated successfully' });
        setNewCode('');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update access code' });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TIDE-ADMIN-2026-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(result);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-tide-text">Security Settings</h1>
        <p className="text-tide-muted mt-1">Manage system-wide security protocols and access controls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-luxury p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-tide-gold/10 border border-tide-gold/20">
              <Shield className="w-6 h-6 text-tide-gold" />
            </div>
            <div>
              <h3 className="font-bold text-tide-text">Admin Access Code</h3>
              <p className="text-xs text-tide-muted">Required for new admin registrations</p>
            </div>
          </div>

          <div className="p-4 bg-tide-bg rounded-xl border border-tide-gold/10">
            <p className="text-[10px] font-bold text-tide-muted uppercase tracking-widest mb-1">Current Active Code</p>
            <p className="text-xl font-mono font-bold text-tide-gold tracking-wider">{currentCode || '••••-••••-••••'}</p>
          </div>

          <form onSubmit={handleUpdateCode} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-tide-muted uppercase tracking-widest">New Access Code</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tide-muted group-focus-within:text-tide-gold transition-colors" />
                <input 
                  type="text"
                  required
                  className="input-field w-full !pl-12"
                  placeholder="TIDE-ADMIN-XXXX-XXXX"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
                message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-tide-danger/10 text-tide-danger border border-tide-danger/20'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={generateRandomCode}
                className="flex-1 py-3 px-4 bg-tide-bg border border-tide-gold/20 text-tide-gold rounded-xl font-bold text-sm hover:bg-tide-gold/10 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
              <button 
                type="submit"
                disabled={loading || !newCode}
                className="flex-[2] btn-primary py-3 px-4 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Update Code
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card-luxury p-8">
            <h3 className="font-bold text-tide-text mb-4">Security Policy</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-tide-gold mt-1.5 shrink-0" />
                <p className="text-sm text-tide-muted">Access codes should be rotated every 30 days for maximum security.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-tide-gold mt-1.5 shrink-0" />
                <p className="text-sm text-tide-muted">Changing the access code does not affect existing admin accounts.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-tide-gold mt-1.5 shrink-0" />
                <p className="text-sm text-tide-muted">All security changes are logged in the system audit trail.</p>
              </li>
            </ul>
          </div>

          <div className="card-luxury p-8 border-l-4 border-l-tide-danger">
            <h3 className="font-bold text-tide-text mb-2">Emergency Protocol</h3>
            <p className="text-sm text-tide-muted mb-4">In case of a suspected breach, regenerate the access code immediately and review all recent activity logs.</p>
            <button className="text-sm font-bold text-tide-danger hover:underline">Revoke All Active Sessions</button>
          </div>
        </div>
      </div>
    </div>
  );
}
