import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Users, 
  Database, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  UserX, 
  UserCheck, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  FileText
} from 'lucide-react';
import { api, type SystemHealth, type User } from '../services/api';

export const AdminSystemPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<Array<User & { prediction_count: number }>>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userQuery, setUserQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);

  const fetchHealthAndUsers = async () => {
    try {
      const [healthData, userData, logsData] = await Promise.all([
        api.getSystemHealth(),
        api.getAdminUsers({ query: userQuery, page: userPage, page_size: 10 }),
        api.getAuditLogs(1, 10),
      ]);
      setHealth(healthData);
      setUsers(userData.users);
      setTotalUserPages(userData.total_pages);
      setAuditLogs(logsData.items);
    } catch (err: any) {
      console.error('Failed to load admin system data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndUsers();
  }, [userPage]);

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    fetchHealthAndUsers();
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    let reason: string | undefined = undefined;
    if (currentStatus) {
      const inputReason = window.prompt('Please provide an auditable reason for deactivating this user account:');
      if (inputReason === null) return;
      reason = inputReason.trim() || 'Deactivated by administrator';
    } else {
      if (!window.confirm('Re-enable this user account?')) return;
    }

    try {
      await api.toggleUserStatus(userId, !currentStatus, reason);
      fetchHealthAndUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-400 font-mono">Loading administrator console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Shield className="w-7 h-7 text-cyan-400" />
          <span>System Administration & Audit Console</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor live backend telemetry, database health, audit security events, and manage passenger accounts.
        </p>
      </div>

      {/* System Health Metric Cards */}
      {health && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase">Backend Health</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2 font-mono flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>{health.status}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Uptime: {Math.round(health.uptime_seconds)}s</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase">Database ({health.database_type})</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300 mt-2 font-mono">Connected</div>
            <span className="text-[11px] text-slate-500 font-mono">Engine: SQLAlchemy ORM</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase">API Response Latency</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2 font-mono">{health.avg_latency_ms} ms</div>
            <span className="text-[11px] text-slate-500">Error rate: {health.error_rate_pct}%</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase">Registered Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2 font-mono">{health.total_users}</div>
            <span className="text-[11px] text-slate-500 font-mono">
              {health.active_users} active • {health.disabled_users} disabled
            </span>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>User & Passenger Account Administration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage account statuses. Passwords and secret hashes are never displayed.
            </p>
          </div>

          <form onSubmit={handleUserSearch} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search user email or name..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Filter
            </button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">User Details</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Predictions</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Last Login</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-white">{u.full_name || 'Anonymous Passenger'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                        u.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                    {u.disabled_reason && (
                      <div className="text-[10px] text-red-400 mt-0.5 italic truncate max-w-xs">
                        {u.disabled_reason}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5 font-mono text-slate-400">{u.prediction_count} forecasts</td>

                  <td className="px-5 py-3.5 font-mono text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-3.5 font-mono text-slate-400">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                          u.is_active
                            ? 'bg-red-950/40 text-red-400 hover:bg-red-900/60'
                            : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60'
                        }`}
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User Pagination */}
        {totalUserPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
            <span>
              Page {userPage} of {totalUserPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={userPage <= 1}
                onClick={() => setUserPage((p) => p - 1)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={userPage >= totalUserPages}
                onClick={() => setUserPage((p) => p + 1)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <span>Security & System Audit Log (Recent Events)</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800 font-mono text-xs">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Actor Email</th>
                <th className="px-5 py-3">Action Event</th>
                <th className="px-5 py-3">Endpoint</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850">
                  <td className="px-5 py-3 text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-5 py-3 text-slate-300">{log.user_email || 'Anonymous'}</td>
                  <td className="px-5 py-3 text-amber-400 font-bold">{log.action}</td>
                  <td className="px-5 py-3 text-slate-400">{log.endpoint}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">
                      {log.status_code || 200}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
