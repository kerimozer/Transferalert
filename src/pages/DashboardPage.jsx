import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { RES_STATUS_BADGE as STATUS_BADGE, FLIGHT_BADGE } from '../lib/status';
import { StatCard, Card, Badge, EmptyState, LoadingBlock } from '../components/ui';
import { Plane, CheckCircle, XCircle, MessageSquare, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [reservations,  setReservations]  = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listReservations(), api.listNotifications()])
      .then(([r, n]) => { setReservations(r || []); setNotifications(n || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><LoadingBlock /></div>;

  const active    = reservations.filter(r => r.status === 'active').length;
  const completed = reservations.filter(r => r.status === 'completed').length;
  const cancelled = reservations.filter(r => r.status === 'cancelled').length;

  const recent = [...reservations]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-ink mb-6">Dashboard</h1>

      {/* İstatistik kartları — dar ekranda 2 sütuna kırılır */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Aktif Takip"     value={active}               icon={Plane}         tone="brand" />
        <StatCard label="Tamamlanan"      value={completed}            icon={CheckCircle}   tone="ok" />
        <StatCard label="İptal"           value={cancelled}            icon={XCircle}       tone="bad" />
        <StatCard label="Toplam Bildirim" value={notifications.length} icon={MessageSquare} tone="accent" />
      </div>

      {/* Son rezervasyonlar */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-semibold text-ink text-sm">Son Rezervasyonlar</h2>
          <Link to="/app/reservations" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
            Tümü <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={Plane}
            title="Henüz rezervasyon yok"
            description="İlk uçuşu ekleyin — yaklaştığında durum güncellemeleri otomatik gelir."
            action={<Link to="/app/reservations" className="text-sm font-semibold text-brand-600 hover:underline">Uçuş Ekle →</Link>}
          />
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
                  <span className="text-xs text-ink-muted whitespace-nowrap">
                    {new Date(r.scheduled_pickup).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  {flight && (
                    <Badge cls={flight.cls}>
                      {flight.label}
                      {r.latest_status.arrival_delay > 0 && ` +${r.latest_status.arrival_delay}dk`}
                    </Badge>
                  )}
                  <Badge cls={status.cls}>{status.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
