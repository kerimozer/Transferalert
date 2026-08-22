import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Rota bazlı kod bölme: önceden TÜM sayfalar tek pakette geliyordu — yolcunun
// telefonda açtığı /track linki bile 570KB'lık admin panelini indiriyordu.
// Artık her sayfa kendi parçası; ziyaretçi yalnız gittiği sayfanın kodunu indirir.
const LandingPage       = lazy(() => import('./pages/LandingPage'));
const LoginPage         = lazy(() => import('./pages/LoginPage'));
const DashboardPage     = lazy(() => import('./pages/DashboardPage'));
const ReservationsPage  = lazy(() => import('./pages/ReservationsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage       = lazy(() => import('./pages/ProfilePage'));
const ReportsPage       = lazy(() => import('./pages/ReportsPage'));
const OrganizationPage  = lazy(() => import('./pages/OrganizationPage'));
const PlatformAdminPage = lazy(() => import('./pages/PlatformAdminPage'));
const TrackPage         = lazy(() => import('./pages/TrackPage'));
const RequestPage       = lazy(() => import('./pages/RequestPage'));
const PrivacyPage       = lazy(() => import('./pages/PrivacyPage'));
const PartnerPortalPage = lazy(() => import('./pages/PartnerPortalPage'));
const PartnersPage      = lazy(() => import('./pages/PartnersPage'));
const JobPage           = lazy(() => import('./pages/JobPage'));
const InvitePage        = lazy(() => import('./pages/InvitePage'));
const DriverPortalPage  = lazy(() => import('./pages/DriverPortalPage'));

const pageFallback = (
  <div className="flex items-center justify-center h-screen text-ink-muted text-sm">
    Yükleniyor...
  </div>
);

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-ink-muted text-sm">
      Yükleniyor...
    </div>
  );
  return user ? children : <Navigate to="/app/login" replace />;
}

function PlatformAdminRoute({ children }) {
  const { isPlatformAdmin, platformAdminLoading } = useAuth();
  if (platformAdminLoading) return (
    <div className="flex items-center justify-center h-screen text-ink-muted text-sm">
      Yükleniyor...
    </div>
  );
  return isPlatformAdmin ? children : <Navigate to="/app" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={pageFallback}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/track/:token" element={<TrackPage />} />
          <Route path="/request/:token" element={<RequestPage />} />
          <Route path="/gizlilik" element={<PrivacyPage />} />
          <Route path="/portal/:token" element={<PartnerPortalPage />} />
          {/* Taşeron şoförün girişsiz iş kartı — TEK işe özel, iş bitince ölür */}
          <Route path="/job/:token" element={<JobPage />} />
          {/* Şoförün KALICI panosu — hesap/uygulama gerekmez, atanan her yeni
              iş aynı linkte belirir. Şoförün asıl yolu budur. */}
          <Route path="/sofor/:token" element={<DriverPortalPage />} />
          {/* Ekip daveti — WhatsApp/SMS ile paylaşılan https link */}
          <Route path="/davet/:token" element={<InvitePage />} />
          <Route path="/app/login" element={<LoginPage />} />
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index                element={<DashboardPage />} />
            <Route path="reservations"  element={<ReservationsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="organization"  element={<OrganizationPage />} />
            <Route path="partners"      element={<PartnersPage />} />
            <Route path="reports"       element={<ReportsPage />} />
            <Route path="profile"       element={<ProfilePage />} />
            <Route path="admin"         element={<PlatformAdminRoute><PlatformAdminPage /></PlatformAdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
