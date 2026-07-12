import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Plane, CheckCircle, XCircle, MessageSquare, ArrowRight } from 'lucide-react';

const STATUS_BADGE = {
  active:    { label: 'Aktif',       cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Tamamlandı',  cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal',       cls: 'bg-red-100 text-red-700' },
};

const FLIGHT_BADGE = {
  landed:    { label: 'İndi',    cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal',   cls: 'bg-red-100 text-red-700' },
  active:    { label: 'Havada',  cls: 'bg-sky-100 text-sky-700' },
  scheduled: { label: 'Planlandı', cls: 'bg-gray-100 text-gray-600' },
  diverted:  { label: 'Yönlendirildi', cls: 'bg-orange-100 text-orange-700' },
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}><Icon size={15} /></div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [reservations,  setReservations]  = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listReservations(), api.listNotifications()])
      .then(([r, n]) => { setReservations(r || []); setNotifications(n || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-400">Yükleniyor...</div>;

  const active    = reservations.filter(r => r.status === 'active').length;
  const completed = reservations.filter(r => r.status === 'completed').length;
  const cancelled = reservations.filter(r => r.status === 'cancelled').length;

  const recent = [...reservations]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Aktif Takip"   value={active}              icon={Plane}         color="text-blue-600 bg-blue-50" />
        <StatCard label="Tamamlanan"    value={completed}           icon={CheckCircle}   color="text-green-600 bg-green-50" />
        <StatCard label="İptal"         value={cancelled}           icon={XCircle}       color="text-red-500 bg-red-50" />
        <StatCard label="Toplam Bildirim" value={notifications.length} icon={MessageSquare} color="text-purple-600 bg-purple-50" />
      </div>

      {/* Son rezervasyonlar */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Son Rezervasyonlar</h2>
          <Link to="/app/reservations" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            Tümü <ArrowRight size={12} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Henüz rezervasyon yok.{' '}
            <Link to="/app/reservations" className="text-blue-600 hover:underline">Ekle →</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map(r => {
              const status  = STATUS_BADGE[r.status]  || STATUS_BADGE.active;
              const flight  = r.latest_status ? (FLIGHT_BADGE[r.latest_status.flight_status] || null) : null;
              return (
                <div key={r.id} className="px-5 py-3.5 flex items-center gap-4">
                  <span className="font-mono font-semibold text-sm text-blue-600 w-20 shrink-0">
                    {r.flight_number}
                  </span>
                  <span className="text-sm text-gray-800 flex-1 truncate">{r.passenger_name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.scheduled_pickup).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  {flight && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${flight.cls}`}>
                      {flight.label}
                      {r.latest_status.arrival_delay > 0 && ` +${r.latest_status.arrival_delay}dk`}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
