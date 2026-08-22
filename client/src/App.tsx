import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { CreateTrip } from './pages/CreateTrip';
import { MyTrips } from './pages/MyTrips';
import { ItineraryBuilder } from './pages/ItineraryBuilder';
import { ItineraryView } from './pages/ItineraryView';
import { TripBudget } from './pages/TripBudget';
import { TripCalendar } from './pages/TripCalendar';
import { PublicTripView } from './pages/PublicTripView';
import { CitySearch } from './pages/CitySearch';
import { ActivitySearch } from './pages/ActivitySearch';
import { CityDetail } from './pages/CityDetail';
import { Profile } from './pages/Profile';
import { SavedDestinations } from './pages/SavedDestinations';
import { AdminDashboard } from './pages/AdminDashboard';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Authenticating...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cities" element={<CitySearch />} />
          <Route path="/activities" element={<ActivitySearch />} />
          <Route path="/cities/:id" element={<CityDetail />} />
          <Route path="/share/:token" element={<PublicTripView />} />

          {/* Protected User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-trip"
            element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-trips"
            element={
              <ProtectedRoute>
                <MyTrips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip/:id/builder"
            element={
              <ProtectedRoute>
                <ItineraryBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip/:id/itinerary"
            element={
              <ProtectedRoute>
                <ItineraryView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip/:id/budget"
            element={
              <ProtectedRoute>
                <TripBudget />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip/:id/calendar"
            element={
              <ProtectedRoute>
                <TripCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedDestinations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
