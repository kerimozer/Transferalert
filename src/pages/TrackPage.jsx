import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plane, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FLIGHT_STATUS = {
  landed:    { label: 'İndi',      icon: CheckCircle,   cls: 'text-ok-600 bg-ok-50 border-ok-600/20' },
  cancelled: { label: 'İptal',     icon: XCircle,       cls: 'text-bad-800 bg-bad-50 border-bad-600/20' },
  active:    { label: 'Havada',    icon: Plane,         cls: 'text-brand-600 bg-brand-50 border-brand-600/20' },
  scheduled: { label: 'Planlandı', icon: Clock,         cls: 'text-ink-muted bg-surface-bg border-surface-border' },
  diverted:  { label: 'Yönlendi',  icon: AlertTriangle, cls: 'text-warn-600 bg-warn-50 border-warn-600/20' },
};

export default function TrackPage() {
  const { token } = useParams();
  const [data, setData]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/public/track/${token}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setData)
      .catch(() => setError('Takip linki bulunamadı veya geçersiz.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-ink-muted text-sm">Yükleniyor...</div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-white border border-surface-border rounded-card shadow-sm p-8 max-w-sm text-center">
        <XCircle size={32} className="text-bad-600 mx-auto mb-3" />
        <p className="text-ink-soft font-semibold">{error}</p>
      </div>
    </div>
  );

  const ls = data.latest_status;
  const fs = ls ? (FLIGHT_STATUS[ls.flight_status] || FLIGHT_STATUS.scheduled) : FLIGHT_STATUS.scheduled;
  const Icon = fs.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-white border border-surface-border rounded-card shadow-sm p-8 max-w-sm w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-brand-600 text-white p-1.5 rounded-control"><Plane size={16} /></div>
          <span className="font-bold text-ink">TransferAlert</span>
        </div>

        <div className={`w-14 h-14 rounded-card flex items-center justify-center border mb-4 ${fs.cls}`}>
          <Icon size={26} />
        </div>

        <p className="font-mono font-bold text-2xl text-ink mb-1">{data.flight_number}</p>
        <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border mb-5 ${fs.cls}`}>
          {fs.label}{ls?.arrival_delay > 0 && ` — ${ls.arrival_delay} dk gecikme`}
        </span>

        <div className="space-y-3 text-sm">
          {ls?.departure_airport && (
            <div className="flex justify-between border-b border-surface-border pb-2">
              <span className="text-ink-muted">Kalkış</span>
              <span className="font-semibold text-ink">{ls.departure_airport}</span>
            </div>
          )}
          {ls?.arrival_airport && (
            <div className="flex justify-between border-b border-surface-border pb-2">
              <span className="text-ink-muted">Varış</span>
              <span className="font-semibold text-ink">{ls.arrival_airport}</span>
            </div>
          )}
          {ls?.estimated_arrival && (
            <div className="flex justify-between border-b border-surface-border pb-2">
              <span className="text-ink-muted">Tahmini Varış</span>
              <span className="font-semibold text-ink">
                {new Date(ls.estimated_arrival).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-muted">Planlanan Alış</span>
            <span className="font-semibold text-ink">
              {new Date(data.scheduled_pickup).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <p className="text-xs text-ink-muted text-center mt-6">Bu sayfa TransferAlert tarafından otomatik güncellenir.</p>
      </div>
    </div>
  );
}
