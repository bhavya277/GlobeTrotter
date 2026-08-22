export interface User {
  id: string;
  email: string;
  name: string;
  profilePhoto?: string;
  bio?: string;
  language: string;
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  costIndex: number;
  popularity: number;
  description?: string;
  image?: string;
  heroImage?: string;
  activities?: Activity[];
  _count?: {
    activities: number;
    stops: number;
  };
}

export interface Activity {
  id: string;
  cityId: string;
  name: string;
  description?: string;
  category: 'Sightseeing' | 'Food' | 'Adventure' | 'Nightlife' | 'Culture' | 'Relaxation' | 'Shopping' | 'Nature' | string;
  estimatedCost: number;
  durationMinutes: number;
  image?: string;
  rating: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: City;
}

export interface TripActivity {
  id: string;
  tripStopId: string;
  activityId?: string | null;
  customName?: string | null;
  category?: string | null;
  scheduledDate: string;
  startTime?: string | null;
  endTime?: string | null;
  customCost?: number | null;
  order: number;
  notes?: string | null;
  isCompleted: boolean;
  activity?: Activity | null;
}

export interface TripStop {
  id: string;
  tripId: string;
  cityId: string;
  startDate: string;
  endDate: string;
  order: number;
  notes?: string;
  city: City;
  tripActivities?: TripActivity[];
  expenses?: Expense[];
}

export interface Expense {
  id: string;
  tripId: string;
  tripStopId?: string | null;
  category: 'Accommodation' | 'Transport' | 'Food' | 'Activities' | 'Shopping' | 'Miscellaneous';
  amount: number;
  currency: string;
  description: string;
  date: string;
  tripStop?: TripStop | null;
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  visibility: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  totalBudget: number;
  currency: string;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
  user?: Partial<User>;
  stops?: TripStop[];
  expenses?: Expense[];
}

export interface ExpenseSummary {
  totalBudget: number;
  totalExpense: number;
  remainingBudget: number;
  categoryBreakdown: Record<string, number>;
}
