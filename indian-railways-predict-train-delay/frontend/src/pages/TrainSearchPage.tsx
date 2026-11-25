import React, { useState } from 'react';
import {
  Train,
  MapPin,
  Clock,
  Calendar,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Info,
  TrendingUp,
} from 'lucide-react';
import { api, type PredictionResult } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  train_number: string;
  train_type: string;
  departure_date: string;
  departure_hour: number;
  distance_km: number;
  scheduled_travel_hours: number;
  num_scheduled_stops: number;
  zone: string;
  season: string;
  traction_type: string;
  source_station_category: string;
  destination_station_category: string;
  fog_risk_score: number;
  zone_congestion_index: number;
  late_incoming_rake: number;
  seat_utilisation_pct: number;
  route_historical_ontime_pct: number;
  loco_age_years: number;
  coach_age_years: number;
  maintenance_score: number;
  track_doubled: number;
  is_electrified: number;
  psr_count: number;
}

const TRAIN_TYPES = [
  'Vande Bharat Express',
  'Rajdhani Express',
  'Shatabdi Express',
  'Duronto Express',
  'Superfast Express',
  'Mail / Express',
  'Intercity Express',
  'Passenger',
  'Suburban / EMU',
];

const ZONES = [
  'Central Railway',
  'Eastern Railway',
  'East Central Railway',
  'East Coast Railway',
  'Northern Railway',
  'North Central Railway',
  'North Eastern Railway',
  'Northeast Frontier Railway',
  'North Western Railway',
  'Southern Railway',
  'South Central Railway',
  'South Eastern Railway',
  'South East Central Railway',
  'South Western Railway',
  'Western Railway',
  'West Central Railway',
  'Metro Railway Kolkata',
];

const SEASONS = ['Winter', 'Summer', 'Monsoon', 'Post-Monsoon'];
const TRACTION = ['Electric (25kV AC)', 'Diesel', 'Electric (DC)', 'Dual'];
const STATION_CATEGORIES = ['A1', 'A', 'B', 'C', 'D', 'E', 'F'];

const today = new Date().toISOString().split('T')[0];

const DEFAULT_FORM: FormState = {
  train_number: '',
  train_type: 'Superfast Express',
  departure_date: today,
  departure_hour: 8,
  distance_km: 500,
  scheduled_travel_hours: 8,
  num_scheduled_stops: 10,
  zone: 'Northern Railway',
  season: 'Winter',
  traction_type: 'Electric (25kV AC)',
  source_station_category: 'A',
  destination_station_category: 'B',
  fog_risk_score: 0.1,
  zone_congestion_index: 0.5,
  late_incoming_rake: 0,
  seat_utilisation_pct: 80,
  route_historical_ontime_pct: 75,
  loco_age_years: 10,
  coach_age_years: 8,
  maintenance_score: 7,
  track_doubled: 1,
  is_electrified: 1,
  psr_count: 2,
};

// ─── Helper UI ────────────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
      {label}
      {hint && <span className="ml-1 font-normal text-slate-500 normal-case">({hint})</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-sm';

// ─── Main Component ───────────────────────────────────────────────────────────

export const TrainSearchPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const set = (key: keyof FormState, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Basic validation
    if (!form.train_number.trim()) {
      setError('Please enter the train number.');
      return;
    }
    if (form.distance_km <= 0) {
      setError('Distance must be greater than 0.');
      return;
    }
    if (form.scheduled_travel_hours <= 0) {
      setError('Scheduled travel duration must be greater than 0 hours.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        train_number: form.train_number.trim(),
        journey_id: `${form.train_number.trim()}-${form.departure_date}`,
        track_doubled: Number(form.track_doubled),
        is_electrified: Number(form.is_electrified),
        zone_fog_index: form.fog_risk_score,
        season_severity_score: form.fog_risk_score,
        has_lhb_coaches: 1,
        is_hdn_route: 0,
        zone_abbr: form.zone.split(' ').map((w) => w[0]).join('').toUpperCase(),
      };
      const res = await api.predictDelay(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError(null);
  };

  // ── Delay color helper
  const delayColor = (mins: number) => {
    if (mins <= 15) return 'text-emerald-400';
    if (mins <= 30) return 'text-yellow-400';
    if (mins <= 120) return 'text-orange-400';
    return 'text-rose-400';
  };

  const severityBadge = (mins: number) => {
    if (mins <= 15) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (mins <= 30) return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
    if (mins <= 120) return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">

      {/* ── Page Header ── */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
          <Train className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Train ETA Predictor
        </h1>
        <p className="text-sm text-slate-400">
          Enter your journey details below and get an ML-powered delay &amp; arrival forecast.
        </p>
      </div>

      {/* ── Input Form ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8"
      >
        {/* Section 1 — Journey Identity */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center space-x-2">
            <Train className="w-3.5 h-3.5" />
            <span>Journey Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Train Number" hint="e.g. 12301">
              <input
                id="inp-train-number"
                type="text"
                required
                maxLength={10}
                value={form.train_number}
                onChange={(e) => set('train_number', e.target.value)}
                placeholder="e.g. 12301"
                className={inputCls}
              />
            </Field>

            <Field label="Train Type">
              <select
                id="inp-train-type"
                value={form.train_type}
                onChange={(e) => set('train_type', e.target.value)}
                className={inputCls}
              >
                {TRAIN_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Railway Zone">
              <select
                id="inp-zone"
                value={form.zone}
                onChange={(e) => set('zone', e.target.value)}
                className={inputCls}
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </Field>

            <Field label="Season">
              <select
                id="inp-season"
                value={form.season}
                onChange={(e) => set('season', e.target.value)}
                className={inputCls}
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Section 2 — Schedule */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center space-x-2 pt-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule &amp; Route</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Departure Date">
              <input
                id="inp-departure-date"
                type="date"
                value={form.departure_date}
                onChange={(e) => set('departure_date', e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Departure Hour" hint="0 – 23">
              <input
                id="inp-departure-hour"
                type="number"
                min={0}
                max={23}
                value={form.departure_hour}
                onChange={(e) => set('departure_hour', parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>

            <Field label="Distance" hint="km">
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="inp-distance"
                  type="number"
                  min={1}
                  value={form.distance_km}
                  onChange={(e) => set('distance_km', parseFloat(e.target.value) || 0)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            <Field label="Scheduled Duration" hint="hours">
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="inp-travel-hours"
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={form.scheduled_travel_hours}
                  onChange={(e) => set('scheduled_travel_hours', parseFloat(e.target.value) || 0)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            <Field label="Scheduled Stops">
              <input
                id="inp-stops"
                type="number"
                min={0}
                value={form.num_scheduled_stops}
                onChange={(e) => set('num_scheduled_stops', parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>

            <Field label="Traction Type">
              <select
                id="inp-traction"
                value={form.traction_type}
                onChange={(e) => set('traction_type', e.target.value)}
                className={inputCls}
              >
                {TRACTION.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Source Station Category">
              <select
                id="inp-src-cat"
                value={form.source_station_category}
                onChange={(e) => set('source_station_category', e.target.value)}
                className={inputCls}
              >
                {STATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Destination Station Category">
              <select
                id="inp-dst-cat"
                value={form.destination_station_category}
                onChange={(e) => set('destination_station_category', e.target.value)}
                className={inputCls}
              >
                {STATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Section 3 — Operational Conditions */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400 flex items-center space-x-2 pt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Operational Conditions</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fog Risk Score" hint="0.0 – 1.0">
              <input
                id="inp-fog"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={form.fog_risk_score}
                onChange={(e) => set('fog_risk_score', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>

            <Field label="Zone Congestion Index" hint="0.0 – 1.0">
              <input
                id="inp-congestion"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={form.zone_congestion_index}
                onChange={(e) => set('zone_congestion_index', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>

            <Field label="Seat Utilisation" hint="%">
              <input
                id="inp-seat"
                type="number"
                min={0}
                max={200}
                value={form.seat_utilisation_pct}
                onChange={(e) => set('seat_utilisation_pct', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>

            <Field label="Historical On-Time Rate" hint="%">
              <input
                id="inp-ontime"
                type="number"
                min={0}
                max={100}
                value={form.route_historical_ontime_pct}
                onChange={(e) => set('route_historical_ontime_pct', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>

            <Field label="Loco Age" hint="years">
              <input
                id="inp-loco-age"
                type="number"
                min={0}
                max={50}
                value={form.loco_age_years}
                onChange={(e) => set('loco_age_years', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>

            <Field label="Coach Age" hint="years">
              <input
                id="inp-coach-age"
                type="number"
                min={0}
                max={50}
                value={form.coach_age_years}
                onChange={(e) => set('coach_age_years', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>

            <Field label="Maintenance Score" hint="1 – 10">
              <input
                id="inp-maintenance"
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={form.maintenance_score}
                onChange={(e) => set('maintenance_score', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>

            <Field label="Late Incoming Rake">
              <select
                id="inp-rake"
                value={String(form.late_incoming_rake)}
                onChange={(e) => set('late_incoming_rake', parseInt(e.target.value))}
                className={inputCls}
              >
                <option value="0">No — Rake arrives on time</option>
                <option value="1">Yes — Incoming rake is late</option>
              </select>
            </Field>

            <Field label="Track Doubled">
              <select
                id="inp-track"
                value={String(form.track_doubled)}
                onChange={(e) => set('track_doubled', parseInt(e.target.value))}
                className={inputCls}
              >
                <option value="1">Yes — Double track</option>
                <option value="0">No — Single track</option>
              </select>
            </Field>

            <Field label="Track Electrified">
              <select
                id="inp-electrified"
                value={String(form.is_electrified)}
                onChange={(e) => set('is_electrified', parseInt(e.target.value))}
                className={inputCls}
              >
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </Field>

            <Field label="PSR Restrictions" hint="count">
              <input
                id="inp-psr"
                type="number"
                min={0}
                max={30}
                value={form.psr_count}
                onChange={(e) => set('psr_count', parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800">
          <button
            id="btn-predict"
            type="submit"
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold hover:opacity-90 active:scale-[0.98] transition shadow-lg shadow-amber-500/25 text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Running ML Model...</span>
              </>
            ) : (
              <>
                <span>Predict Delay &amp; ETA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            id="btn-reset"
            type="button"
            onClick={handleReset}
            className="px-5 py-3.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition text-sm font-semibold flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </form>

      {/* ── Result Card ── */}
      {result && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Forecast Result
              </span>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${severityBadge(result.predicted_delay_minutes)}`}>
              {result.delay_severity}
            </span>
          </div>

          {/* Big Delay Number */}
          <div className="text-center py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Predicted Delay
            </p>
            <div className={`text-6xl sm:text-7xl font-black font-mono ${delayColor(result.predicted_delay_minutes)}`}>
              {result.predicted_delay_minutes}
            </div>
            <p className="text-slate-400 text-sm mt-1">minutes</p>
          </div>

          {/* 3-column time grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Scheduled Departure</p>
              <p className="text-sm font-bold text-slate-200 font-mono">
                {result.scheduled_departure ?? '—'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Scheduled Arrival</p>
              <p className="text-sm font-bold text-slate-200 font-mono">
                {result.scheduled_arrival ?? '—'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 text-center space-y-1">
              <p className="text-[11px] text-amber-400 uppercase font-semibold tracking-wider">Estimated ETA</p>
              <p className="text-sm font-black text-emerald-400 font-mono">
                {result.estimated_arrival ?? '—'}
              </p>
            </div>
          </div>

          {/* Confidence & Model Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Model: <span className="text-slate-300">{result.model_version}</span></span>
            </span>
            {result.confidence_interval && (
              <span>
                Confidence range:{' '}
                <span className="font-mono text-slate-300">
                  {result.confidence_interval.lower_bound}m — {result.confidence_interval.upper_bound}m
                </span>
              </span>
            )}
          </div>

          {/* On-time indicator */}
          {result.predicted_delay_minutes <= 15 ? (
            <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Train is expected to arrive on time.</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-amber-400 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Delay expected — plan accordingly.</span>
            </div>
          )}

          {/* Run another */}
          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-semibold transition flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Predict Another Journey</span>
          </button>
        </div>
      )}
    </div>
  );
};
