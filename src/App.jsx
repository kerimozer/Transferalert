import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout            from './components/Layout';
import LandingPage       from './pages/LandingPage';
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import ReservationsPage  from './pages/ReservationsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage       from './pages/ProfilePage';
import ReportsPage       from './pages/ReportsPage';
import DriversPage       from './pages/DriversPage';
import OrganizationPage  from './pages/OrganizationPage';
import PlatformAdminPage from './pages/PlatformAdminPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      Yükleniyor...
    </div>
  );
  return user ? children : <Navigate to="/app/login" replace />;
}

function PlatformAdminRoute({ children }) {
  const { isPlatformAdmin } = useAuth();
  return isPlatformAdmin ? children : <Navigate to="/app" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app/login" element={<LoginPage />} />
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index                element={<DashboardPage />} />
            <Route path="reservations"  element={<ReservationsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="drivers"       element={<DriversPage />} />
            <Route path="organization"  element={<OrganizationPage />} />
            <Route path="reports"       element={<ReportsPage />} />
            <Route path="profile"       element={<ProfilePage />} />
            <Route path="admin"         element={<PlatformAdminRoute><PlatformAdminPage /></PlatformAdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
