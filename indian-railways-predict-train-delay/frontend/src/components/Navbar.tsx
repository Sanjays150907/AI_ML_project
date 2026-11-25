import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Train, 
  BarChart3, 
  History, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  Search, 
  Activity, 
  Home, 
  Cpu
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Train className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">RailETA</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PCA-ML
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Indian Railways Dynamic ETA Forecasting</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('home')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'home'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Overview</span>
            </button>

            {user && (
              <>
                <button
                  onClick={() => setCurrentTab('trains')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'trains'
                      ? 'bg-slate-800 text-amber-400'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Train Search & ETA</span>
                </button>

                <button
                  onClick={() => setCurrentTab('history')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'history'
                      ? 'bg-slate-800 text-amber-400'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>My History</span>
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => setCurrentTab('admin-ml')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'admin-ml'
                      ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                      : 'text-cyan-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>ML & PCA Diagnostics</span>
                </button>

                <button
                  onClick={() => setCurrentTab('admin-system')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'admin-system'
                      ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                      : 'text-cyan-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Console</span>
                </button>
              </>
            )}
          </nav>

          {/* User Status / Auth Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div
                  onClick={() => setCurrentTab('profile')}
                  className="hidden sm:flex flex-col text-right cursor-pointer hover:opacity-80"
                >
                  <span className="text-sm font-medium text-slate-200">{user.full_name || user.email.split('@')[0]}</span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center justify-end space-x-1">
                    {isAdmin ? (
                      <span className="text-cyan-400 font-semibold flex items-center">
                        <Shield className="w-3 h-3 mr-0.5 inline" /> Administrator
                      </span>
                    ) : (
                      <span>Passenger</span>
                    )}
                  </span>
                </div>

                <button
                  onClick={() => setCurrentTab('profile')}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Profile Settings"
                >
                  <UserIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-red-200 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentTab('login')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentTab('register')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
