import React from 'react';
import { Train, Activity, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-10 sm:p-16 shadow-2xl w-full max-w-3xl text-center">
        {/* Ambient glows */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-6 shadow-lg shadow-amber-500/10">
            <Train className="w-8 h-8 stroke-[2]" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Final-Year Engineering Project</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
            Dynamic Forecast of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Train ETA
            </span>{' '}
            Using PCA &amp; Machine Learning
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-10 max-w-xl mx-auto">
            A production-oriented Indian Railways arrival forecasting engine powered by a genuine
            Scikit-Learn PCA pipeline and multi-model benchmarking with role-based dashboards.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              id="btn-primary-cta"
              onClick={() => onNavigate(user ? 'trains' : 'login')}
              className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/25 transition group text-sm"
            >
              <span>{user ? 'Search Trains & Forecast ETA' : 'Sign In to Forecast'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>

            {isAdmin && (
              <button
                id="btn-admin-ml"
                onClick={() => onNavigate('admin-ml')}
                className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold hover:bg-slate-700 hover:text-white transition text-sm"
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Admin ML &amp; PCA Diagnostics</span>
              </button>
            )}

            {!user && (
              <button
                id="btn-register"
                onClick={() => onNavigate('register')}
                className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-semibold hover:bg-slate-700 hover:text-white transition text-sm"
              >
                <span>Create Passenger Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
