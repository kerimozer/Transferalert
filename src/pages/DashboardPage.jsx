import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Plane, CheckCircle, XCircle, MessageSquare, ArrowRight } from 'lucide-react';

const STATUS_BADGE = {
  active:    { label: 'Aktif',       cls: 'bg-brand-50 text-brand-700' },
  completed: { label: 'Tamamlandı',  cls: 'bg-ok-50 text-ok-800' },
  cancelled: { label: 'İptal',       cls: 'bg-bad-50 text-bad-800' },
};

const FLIGHT_BADGE = {
  landed:    { label: 'İndi',    cls: 'bg-ok-50 text-ok-800' },
  cancelled: { label: 'İptal',   cls: 'bg-bad-50 text-bad-800' },
  active:    { label: 'Havada',  cls: 'bg-brand-50 text-brand-700' },
  scheduled: { label: 'Planlandı', cls: 'bg-surface-alt text-ink-soft' },
  diverted:  { label: 'Yönlendirildi', cls: 'bg-warn-50 text-warn-800' },
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white border border-surface-border rounded-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-ink-muted">{label}</span>
        <div className={`p-2 rounded-control ${color}`}><Icon size={15} /></div>
      </div>
      <div className="text-3xl font-bold text-ink">{value}</div>
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

  if (loading) return <div className="p-8 text-sm text-ink-muted">Yükleniyor...</div>;

  const active    = reservations.filter(r => r.status === 'active').length;
  const completed = reservations.filter(r => r.status === 'completed').length;
  const cancelled = reservations.filter(r => r.status === 'cancelled').length;

  const recent = [...reservations]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-ink mb-6">Dashboard</h1>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Aktif Takip"   value={active}              icon={Plane}         color="text-brand-600 bg-brand-50" />
        <StatCard label="Tamamlanan"    value={completed}           icon={CheckCircle}   color="text-ok-600 bg-ok-50" />
        <StatCard label="İptal"         value={cancelled}           icon={XCircle}       color="text-bad-600 bg-bad-50" />
        <StatCard label="Toplam Bildirim" value={notifications.length} icon={MessageSquare} color="text-accent-600 bg-accent-50" />
      </div>

      {/* Son rezervasyonlar */}
      <div className="bg-white border border-surface-border rounded-card">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-semibold text-ink text-sm">Son Rezervasyonlar</h2>
          <Link to="/app/reservations" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
            Tümü <ArrowRight size={12} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-muted">
            Henüz rezervasyon yok.{' '}
            <Link to="/app/reservations" className="text-brand-600 hover:underline">Ekle →</Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {recent.map(r => {
              const status  = STATUS_BADGE[r.status]  || STATUS_BADGE.active;
              const flight  = r.latest_status ? (FLIGHT_BADGE[r.latest_status.flight_status] || null) : null;
              return (
                <div key={r.id} className="px-5 py-3.5 flex items-center gap-4">
                  <span className="font-mono font-semibold text-sm text-brand-600 w-20 shrink-0">
                    {r.flight_number}
                  </span>
                  <span className="text-sm text-ink flex-1 truncate">{r.passenger_name}</span>
                  <span className="text-xs text-ink-muted">
                    {new Date(r.scheduled_pickup).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  {flight && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${flight.cls}`}>
                      {flight.label}
                      {r.latest_status.arrival_delay > 0 && ` +${r.latest_status.arrival_delay}dk`}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
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
