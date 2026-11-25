// API Service Layer for Indian Railways ETA Forecasting

const API_BASE = '/api';

export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface TrainRecord {
  journey_id: string;
  train_number: string;
  train_type: string;
  departure_date: string;
  departure_hour: number;
  distance_km: number;
  num_scheduled_stops: number;
  scheduled_travel_hours: number;
  zone: string;
  zone_abbr?: string;
  season: string;
  traction_type?: string;
  source_station_category?: string;
  destination_station_category?: string;
  is_hdn_route?: number;
  route_historical_ontime_pct?: number;
  historical_delay_minutes?: number;
  full_attributes?: Record<string, any>;
}

export interface PredictionResult {
  predicted_delay_minutes: number;
  is_delayed: boolean;
  delay_severity: string;
  scheduled_departure?: string;
  scheduled_arrival?: string;
  estimated_arrival?: string;
  model_version: string;
  model_type: string;
  prediction_timestamp: string;
  confidence_interval?: {
    lower_bound: number;
    upper_bound: number;
  };
  factors_summary?: Record<string, any>;
}

export interface PredictionHistoryItem {
  id: number;
  journey_id?: string;
  train_number: string;
  train_type?: string;
  departure_date?: string;
  distance_km?: number;
  scheduled_travel_hours?: number;
  predicted_delay_minutes: number;
  is_delayed_predicted: boolean;
  scheduled_arrival?: string;
  estimated_arrival?: string;
  model_version: string;
  created_at: string;
  inputs_snapshot?: Record<string, any>;
}

export interface SystemHealth {
  status: string;
  database_connected: boolean;
  database_type: string;
  model_loaded: boolean;
  active_model_version?: string;
  active_model_type?: string;
  total_users: number;
  active_users: number;
  disabled_users: number;
  total_predictions: number;
  avg_latency_ms: number;
  error_rate_pct: number;
  uptime_seconds: number;
  timestamp: string;
}

export interface MLMonitoringData {
  active_model?: any;
  model_comparisons: Array<{
    model_name: string;
    model_type: string;
    has_pca: boolean;
    mae: number;
    rmse: number;
    r2: number;
    training_time_seconds?: number;
    retained_components?: number;
    is_primary: boolean;
  }>;
  pca_analytics?: {
    n_original_features: number;
    n_components_retained: number;
    variance_threshold: number;
    explained_variance_ratio: number[];
    cumulative_variance: number[];
    feature_names: string[];
    top_loadings?: Record<string, Record<string, number>>;
  };
  actual_vs_predicted?: Array<{ actual: number; predicted: number }>;
  error_distribution?: Array<{ bin: string; count: number }>;
  dataset_row_count: number;
  dataset_col_count: number;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Don't auto-logout if we're just checking /auth/me on initial load
      if (!endpoint.includes('/auth/me')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        window.dispatchEvent(new Event('auth-expired'));
      }
    }

    if (!response.ok) {
      let errorMsg = `Request failed (${response.status})`;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.detail || errorJson.message || errorMsg;
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth APIs
  async register(data: { email: string; password: string; full_name?: string }) {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    const res = await this.request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('current_user', JSON.stringify(res.user));
    return res;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
    }
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: { full_name?: string; password?: string }) {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Trains
  async searchTrains(params: {
    query?: string;
    train_type?: string;
    zone?: string;
    min_distance?: number;
    max_distance?: number;
    page?: number;
    page_size?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.train_type) searchParams.append('train_type', params.train_type);
    if (params.zone) searchParams.append('zone', params.zone);
    if (params.min_distance) searchParams.append('min_distance', String(params.min_distance));
    if (params.max_distance) searchParams.append('max_distance', String(params.max_distance));
    searchParams.append('page', String(params.page || 1));
    searchParams.append('page_size', String(params.page_size || 15));

    return this.request<{
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      trains: TrainRecord[];
      filter_options?: { train_types: string[]; zones: string[] };
    }>(`/trains/search?${searchParams.toString()}`);
  }

  async getJourney(journeyId: string) {
    return this.request<Record<string, any>>(`/trains/journey/${encodeURIComponent(journeyId)}`);
  }

  // Predictions
  async predictDelay(data: Record<string, any>) {
    return this.request<PredictionResult>('/predictions/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPredictionHistory(page = 1, pageSize = 10) {
    return this.request<{
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      items: PredictionHistoryItem[];
    }>(`/predictions/history?page=${page}&page_size=${pageSize}`);
  }

  async deletePrediction(id: number) {
    return this.request<{ message: string }>(`/predictions/history/${id}`, {
      method: 'DELETE',
    });
  }

  async clearAllHistory() {
    return this.request<{ message: string }>('/predictions/history', {
      method: 'DELETE',
    });
  }

  // Admin APIs
  async getAdminUsers(params: { query?: string; page?: number; page_size?: number }) {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    searchParams.append('page', String(params.page || 1));
    searchParams.append('page_size', String(params.page_size || 15));

    return this.request<{
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      users: Array<User & { prediction_count: number; disabled_reason?: string }>;
    }>(`/admin/users?${searchParams.toString()}`);
  }

  async toggleUserStatus(userId: number, isActive: boolean, disabledReason?: string) {
    return this.request<{ message: string }>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive, disabled_reason: disabledReason }),
    });
  }

  async getSystemHealth() {
    return this.request<SystemHealth>('/admin/system-health');
  }

  async getMLMonitoring() {
    return this.request<MLMonitoringData>('/admin/ml-monitoring');
  }

  async getAuditLogs(page = 1, pageSize = 20) {
    return this.request<{
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      items: Array<{
        id: number;
        user_id?: number;
        user_email?: string;
        action: string;
        endpoint: string;
        ip_address?: string;
        status_code?: number;
        response_time_ms?: number;
        created_at: string;
      }>;
    }>(`/admin/audit-logs?page=${page}&page_size=${pageSize}`);
  }

  async getLiveFeedStatus() {
    return this.request<{
      feed_active: boolean;
      feed_provider: string;
      feed_status: string;
      message: string;
    }>('/live/status');
  }
}

export const api = new ApiClient();
