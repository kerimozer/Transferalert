import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plane, LayoutDashboard, Bell, LogOut, User, Users, BarChart2, Menu, X, Building2, ShieldCheck } from 'lucide-react';

const NAV = [
  { to: '/app',               label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/app/reservations',  label: 'Uçuşlarım',      icon: Plane },
  { to: '/app/drivers',       label: 'Sürücüler',      icon: Users },
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
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Plane size={20} className="text-blue-600" />
        <span className="font-bold text-gray-900 tracking-tight">TransferAlert</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <LogOut size={16} /> Çıkış Yap
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-gray-200 flex-col">
        {navContent}
      </aside>

      {/* Mobile: hamburger + drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(true)} className="text-gray-600">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <Plane size={18} className="text-blue-600" />
          <span className="font-bold text-gray-900 text-sm">TransferAlert</span>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-white flex flex-col h-full shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400">
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
