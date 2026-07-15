import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plane, LayoutDashboard, Bell, LogOut, User, BarChart2, Menu, X, Building2, ShieldCheck } from 'lucide-react';

const NAV = [
  { to: '/app',               label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/app/reservations',  label: 'Uçuşlarım',      icon: Plane },
  { to: '/app/organization',  label: 'Firma Yönetimi', icon: Building2 },
  { to: '/app/notifications', label: 'Bildirimler',    icon: Bell },
  { to: '/app/reports',       label: 'Raporlar',       icon: BarChart2 },
  { to: '/app/profile',       label: 'Profil',         icon: User },
];

export default function Layout() {
  const { logout, isPlatformAdmin } = useAuth();
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = isPlatformAdmin
    ? [...NAV, { to: '/app/admin', label: 'Platform', icon: ShieldCheck }]
    : NAV;

  async function handleLogout() {
    await logout();
    navigate('/app/login');
  }

  const navContent = (
    <>
      <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
        <Plane size={20} className="text-brand-600" />
        <span className="font-bold text-ink tracking-tight">TransferAlert</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-control text-sm transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-soft hover:bg-surface-alt'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-surface-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-control text-sm text-ink-muted hover:bg-surface-alt transition-colors"
        >
          <LogOut size={16} /> Çıkış Yap
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-surface-bg font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-surface-border flex-col">
        {navContent}
      </aside>

      {/* Mobile: hamburger + drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-surface-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(true)} className="text-ink-soft">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <Plane size={18} className="text-brand-600" />
          <span className="font-bold text-ink text-sm">TransferAlert</span>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-white flex flex-col h-full shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-ink-muted">
              <X size={20} />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* İçerik */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
