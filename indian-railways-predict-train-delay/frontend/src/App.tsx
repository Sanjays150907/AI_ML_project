import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TrainSearchPage } from './pages/TrainSearchPage';
import { PredictionHistoryPage } from './pages/PredictionHistoryPage';
import { AdminMLPage } from './pages/AdminMLPage';
import { AdminSystemPage } from './pages/AdminSystemPage';
import { ProfilePage } from './pages/ProfilePage';
import { Train, Shield, Layers } from 'lucide-react';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400 font-mono">Initializing RailETA Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'home' && <HomePage onNavigate={setCurrentTab} />}

        {currentTab === 'login' && <LoginPage onNavigate={setCurrentTab} />}

        {currentTab === 'register' && <RegisterPage onNavigate={setCurrentTab} />}

        {currentTab === 'trains' && (
          user ? <TrainSearchPage /> : <LoginPage onNavigate={setCurrentTab} />
        )}

        {currentTab === 'history' && (
          user ? <PredictionHistoryPage /> : <LoginPage onNavigate={setCurrentTab} />
        )}

        {currentTab === 'profile' && (
          user ? <ProfilePage /> : <LoginPage onNavigate={setCurrentTab} />
        )}

        {currentTab === 'admin-ml' && (
          isAdmin ? <AdminMLPage /> : <HomePage onNavigate={setCurrentTab} />
        )}

        {currentTab === 'admin-system' && (
          isAdmin ? <AdminSystemPage /> : <HomePage onNavigate={setCurrentTab} />
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Train className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">
              Dynamic Forecast of Train ETA Using PCA & Machine Learning
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span>Dataset: 1.5M ir_train.csv</span>
            <span>•</span>
            <span>PCA Variance: 95.7%</span>
            <span>•</span>
            <span>Auth: Argon2id</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Final-Year Engineering Project • All Rights Reserved
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
