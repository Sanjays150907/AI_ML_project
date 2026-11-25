import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Train, Lock, Mail, User, AlertCircle, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (tab: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, login } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      return 'Please enter your full name (at least 2 characters).';
    }
    if (!email.trim()) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match. Please re-enter your password.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim());
      // Auto-login after registration — regular users always go to trains
      await login(email.trim(), password);
      onNavigate('trains');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getStrength = (pw: string) => {
    if (pw.length === 0) return { level: 0, label: '', color: '' };
    if (pw.length < 8) return { level: 1, label: 'Too short', color: 'bg-red-500' };
    let score = 0;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score === 0) return { level: 2, label: 'Weak', color: 'bg-orange-500' };
    if (score === 1) return { level: 3, label: 'Fair', color: 'bg-yellow-400' };
    if (score === 2) return { level: 4, label: 'Good', color: 'bg-emerald-400' };
    return { level: 5, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(password);

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4">
          <Train className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Create Passenger Account</h2>
        <p className="text-sm text-slate-400 mt-1">Register to save delay forecasts and journey history</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Security notice regarding role */}
      <div className="mb-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-400">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          Public registration strictly creates a <strong>regular user account</strong>. Administrator roles cannot be registered through this form.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label htmlFor="reg-fullname" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              id="reg-fullname"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ramesh@gmail.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Password <span className="text-slate-500 normal-case font-normal">(min 8 characters)</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition text-sm"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Strength indicator */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex space-x-1 h-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.level ? strength.color : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Strength: <span className="font-semibold text-slate-300">{strength.label}</span>
                {strength.level < 4 && (
                  <span className="ml-1 text-slate-500">— add uppercase, numbers, or symbols</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="reg-confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              id="reg-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border text-white placeholder-slate-500 focus:outline-none transition text-sm ${
                confirmPassword && confirmPassword !== password
                  ? 'border-red-500/60 focus:border-red-500'
                  : confirmPassword && confirmPassword === password
                  ? 'border-emerald-500/60 focus:border-emerald-500'
                  : 'border-slate-800 focus:border-amber-500'
              }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="text-[11px] text-red-400 mt-1">Passwords do not match.</p>
          )}
          {confirmPassword && confirmPassword === password && (
            <p className="text-[11px] text-emerald-400 mt-1">Passwords match ✓</p>
          )}
        </div>

        <button
          id="btn-register-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
        >
          {loading ? (
            <span>Creating Account...</span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400">
          Already registered?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-amber-400 hover:text-amber-300 font-semibold underline"
          >
            Sign In here
          </button>
        </p>
      </div>
    </div>
  );
};
