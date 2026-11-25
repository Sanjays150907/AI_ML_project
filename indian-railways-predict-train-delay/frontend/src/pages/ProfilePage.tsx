import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, KeyRound, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isAdmin } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        password: newPassword ? newPassword : undefined,
      });
      setNewPassword('');
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <User className="w-6 h-6 text-amber-400" />
          <span>Account Settings & Profile</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage your account information and password.</p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-3 ${
            msg.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border border-red-500/30 text-red-300'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Metadata</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Email Address</span>
            <span className="text-slate-200 font-bold">{user.email}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Assigned Role</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isAdmin
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {user.role.toUpperCase()}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Account Created</span>
            <span className="text-slate-200">{new Date(user.created_at).toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Last Login</span>
            <span className="text-slate-200">
              {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Current Session'}
            </span>
          </div>
        </div>
      </div>

      {/* Update Profile Form */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Update Personal Info</h3>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              New Password (leave empty to keep current password)
            </label>
            <input
              type="password"
              value={newPassword}
              placeholder="Minimum 8 characters"
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-sm transition shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};
