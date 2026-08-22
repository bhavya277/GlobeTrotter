import { User, Trip, City, Activity, Expense, ExpenseSummary, TripActivity, TripStop } from '../types';

const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('globetrotter_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'An unexpected error occurred' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth APIs
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse<{ token: string; user: User }>(res);
    },
    register: async (name: string, email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      return handleResponse<{ token: string; user: User }>(res);
    },
    forgotPassword: async (email: string) => {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return handleResponse<{ message: string }>(res);
    },
    resetPassword: async (token: string, newPassword: string) => {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      return handleResponse<{ message: string }>(res);
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ user: User }>(res);
    },
  },

  // User Profile APIs
  users: {
    updateProfile: async (data: Partial<User>) => {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return handleResponse<{ user: User }>(res);
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      const res = await fetch(`${API_BASE}/users/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return handleResponse<{ message: string }>(res);
    },
    deleteAccount: async (confirmText: string) => {
      const res = await fetch(`${API_BASE}/users/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ confirmText }),
      });
      return handleResponse<{ message: string }>(res);
    },
  },

  // City Catalog APIs
  cities: {
    getAll: async (params?: { search?: string; country?: string; region?: string; minPopularity?: number; maxCost?: number; sortBy?: string }) => {
      const query = new URLSearchParams(params as any || {}).toString();
      const res = await fetch(`${API_BASE}/cities?${query}`);
      return handleResponse<{ cities: City[] }>(res);
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_BASE}/cities/${id}`);
      return handleResponse<{ city: City }>(res);
    },
  },

  // Activity Catalog APIs
  activities: {
    getAll: async (params?: { cityId?: string; category?: string; search?: string; maxCost?: number; maxDuration?: number }) => {
      const query = new URLSearchParams(params as any || {}).toString();
      const res = await fetch(`${API_BASE}/activities?${query}`);
      return handleResponse<{ activities: Activity[] }>(res);
    },
  },

  // Saved Destinations APIs
  savedDestinations: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/saved-destinations`, {
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ savedDestinations: City[] }>(res);
    },
    toggle: async (cityId: string) => {
      const res = await fetch(`${API_BASE}/saved-destinations/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ cityId }),
      });
      return handleResponse<{ saved: boolean; message: string }>(res);
    },
  },

  // Trip APIs
  trips: {
    getMyTrips: async () => {
      const res = await fetch(`${API_BASE}/trips`, {
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ trips: Trip[] }>(res);
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_BASE}/trips/${id}`, {
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ trip: Trip; isOwner: boolean }>(res);
    },
    getByShareToken: async (token: string) => {
      const res = await fetch(`${API_BASE}/trips/shared/${token}`);
      return handleResponse<{ trip: Trip; isShared: boolean }>(res);
    },
    create: async (data: {
      name: string;
      description?: string;
      startDate: string;
      endDate: string;
      coverPhoto?: string;
      visibility?: string;
      totalBudget?: number;
      currency?: string;
      cityIds?: string[];
    }) => {
      const res = await fetch(`${API_BASE}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return handleResponse<{ trip: Trip }>(res);
    },
    copy: async (token: string) => {
      const res = await fetch(`${API_BASE}/trips/copy/${token}`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ trip: Trip; message: string }>(res);
    },
    update: async (id: string, data: Partial<Trip>) => {
      const res = await fetch(`${API_BASE}/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return handleResponse<{ trip: Trip }>(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/trips/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ message: string }>(res);
    },
    // Multi-City Stops Management
    addStop: async (tripId: string, data: { cityId: string; startDate: string; endDate: string; notes?: string }) => {
      const res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return handleResponse<{ stop: TripStop }>(res);
    },
    updateStop: async (tripId: string, stopId: string, data: { startDate?: string; endDate?: string; notes?: string; order?: number }) => {
      const res = await fetch(`${API_BASE}/trips/${tripId}/stops/${stopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return handleResponse<{ stop: TripStop }>(res);
    },
    reorderStops: async (tripId: string, orderedStopIds: string[]) => {
      const res = await fetch(`${API_BASE}/trips/${tripId}/stops/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ orderedStopIds }),
      });
      return handleResponse<{ stops: TripStop[] }>(res);
    },
    deleteStop: async (tripId: string, stopId: string) => {
      const res = await fetch(`${API_BASE}/trips/${tripId}/stops/${stopId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ message: string }>(res);
    },
  },

  // Trip Activities APIs
  tripActivities: {
    add: async (data: {
      tripStopId: string;
      activityId?: string;
      customName?: string;
      category?: string;
      scheduledDate: string;
      startTime?: string;
      endTime?: string;
      customCost?: number;
      notes?: string;
    }) => {
      const res = await fetch(`${API_BASE}/trip-activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return handleResponse<{ tripActivity: TripActivity }>(res);
    },
    update: async (id: string, data: Partial<TripActivity>) => {
      const res = await fetch(`${API_BASE}/trip-activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return handleResponse<{ tripActivity: TripActivity }>(res);
    },
    reorder: async (orderedActivityIds: string[]) => {
      const res = await fetch(`${API_BASE}/trip-activities/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ orderedActivityIds }),
      });
      return handleResponse<{ message: string }>(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/trip-activities/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ message: string }>(res);
    },
  },

  // Expense APIs
  expenses: {
    getByTrip: async (tripId: string) => {
      const res = await fetch(`${API_BASE}/expenses/trip/${tripId}`, {
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<any>(res);
    },
    create: async (data: {
      tripId: string;
      tripStopId?: string;
      category: string;
      amount: number;
      currency?: string;
      description: string;
      date: string;
    }) => {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return handleResponse<{ expense: Expense }>(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/expenses/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ message: string }>(res);
    },
  },

  // Unique Intelligence Layer APIs (Phase 9)
  intelligence: {
    getTripIntelligence: async (tripId: string) => {
      const res = await fetch(`${API_BASE}/trips/${tripId}/intelligence`, {
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{
        intelligence: {
          budgetOptimizer: Array<{
            title: string;
            percentageShare: number;
            insight: string;
            suggestion: string;
            type: 'warning' | 'info';
          }>;
          dailyBalance: Array<{
            dateStr: string;
            activityCount: number;
            estimatedHours: number;
            insight: string;
            recommendation: string;
            isOverloaded: boolean;
          }>;
          travelFlow: {
            totalDistanceKm: number;
            stopsCount: number;
            routeLegs: Array<{ from: string; to: string; distanceKm: number }>;
            isFlowEfficient: boolean;
            flowInsight: string;
          };
          personalizedRecommendations: Array<{
            id: string;
            name: string;
            cityName: string;
            category: string;
            estimatedCost: number;
            rating: number;
            image: string;
            reason: string;
          }>;
        };
      }>(res);
    },
  },

  // Admin / Analytics APIs (Phase 12 RBAC)
  admin: {
    getStats: async () => {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{
        stats: {
          totalUsers: number;
          totalTrips: number;
          totalCities: number;
          totalActivities: number;
          totalExpenses: number;
        };
        popularCities: Array<{ cityName: string; country: string; stopCount: number }>;
        popularActivities: Array<{ name: string; category: string; scheduledCount: number }>;
      }>(res);
    },
    getUsers: async () => {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ users: any[] }>(res);
    },
    updateUserRole: async (userId: string, role: string) => {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role }),
      });
      return handleResponse<{ user: any; message: string }>(res);
    },
    deleteUser: async (userId: string) => {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      return handleResponse<{ message: string }>(res);
    },
  },
};
