import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Clock, 
  Train, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import { api, type PredictionHistoryItem } from '../services/api';

export const PredictionHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPredictionHistory(page, 10);
      setHistory(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.message || 'Failed to load forecast history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this forecast record?')) return;
    try {
      await api.deletePrediction(id);
      fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear your entire prediction history? This cannot be undone.')) return;
    try {
      await api.clearAllHistory();
      fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to clear history.');
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <History className="w-7 h-7 text-amber-400" />
            <span>My Forecast History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Personal record of train delay predictions and estimated arrival times. Isolated to your account.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 rounded-xl bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/60 transition text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400 font-mono">Loading your saved forecasts...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center space-y-3 p-8 rounded-2xl bg-slate-900 border border-slate-800">
          <Clock className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No predictions recorded yet</h3>
          <p className="text-xs text-slate-400">
            Search for any coaching train and request a delay forecast to record results here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Train Details</th>
                  <th className="px-5 py-3.5">Predicted Delay</th>
                  <th className="px-5 py-3.5">Scheduled Arrival</th>
                  <th className="px-5 py-3.5">Estimated ETA</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-850 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          #{item.train_number}
                        </span>
                        <span className="font-semibold text-white text-xs">{item.train_type || 'Express'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2 font-mono">
                        <span>{item.distance_km || 0} km</span>
                        <span>•</span>
                        <span>{item.scheduled_travel_hours || 0}h travel</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-sm text-amber-400">
                        {item.predicted_delay_minutes} min
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          item.is_delayed_predicted
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {item.is_delayed_predicted ? 'Late (>15m)' : 'On-Time'}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-300">
                      {item.scheduled_arrival || 'N/A'}
                    </td>

                    <td className="px-5 py-4 font-mono text-xs font-bold text-emerald-400">
                      {item.estimated_arrival || 'N/A'}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-slate-500 hover:text-red-400 transition"
                        title="Delete forecast entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span>
                Showing page {page} of {totalPages} (Total: {total} records)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
