import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Train, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'admin') {
        onNavigate('admin-ml');
      } else {
        onNavigate('trains');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4">
          <Train className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to RailETA</h2>
        <p className="text-sm text-slate-400 mt-1">Access real train searches and delay forecasts</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. commuter@railway.in"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>
        </div>

        <button
          id="btn-login-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
        >
          {loading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-amber-400 hover:text-amber-300 font-semibold underline"
          >
            Register as Passenger
          </button>
        </p>
      </div>
    </div>
  );
};
