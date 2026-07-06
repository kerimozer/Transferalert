import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plane, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FLIGHT_STATUS = {
  landed:    { label: 'İndi',      icon: CheckCircle,   cls: 'text-green-600 bg-green-50 border-green-200' },
  cancelled: { label: 'İptal',     icon: XCircle,       cls: 'text-red-600 bg-red-50 border-red-200' },
  active:    { label: 'Havada',    icon: Plane,         cls: 'text-blue-600 bg-blue-50 border-blue-200' },
  scheduled: { label: 'Planlandı', icon: Clock,         cls: 'text-gray-500 bg-gray-50 border-gray-200' },
  diverted:  { label: 'Yönlendi',  icon: AlertTriangle, cls: 'text-orange-600 bg-orange-50 border-orange-200' },
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 text-sm">Yükleniyor...</div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-sm text-center">
        <XCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">{error}</p>
      </div>
    </div>
  );

  const ls = data.latest_status;
  const fs = ls ? (FLIGHT_STATUS[ls.flight_status] || FLIGHT_STATUS.scheduled) : FLIGHT_STATUS.scheduled;
  const Icon = fs.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-sm w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Plane size={16} /></div>
          <span className="font-bold text-gray-900">TransferAlert</span>
        </div>

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-4 ${fs.cls}`}>
          <Icon size={26} />
        </div>

        <p className="font-mono font-bold text-2xl text-gray-900 mb-1">{data.flight_number}</p>
        <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full border mb-5 ${fs.cls}`}>
          {fs.label}{ls?.arrival_delay > 0 && ` — ${ls.arrival_delay} dk gecikme`}
        </span>

        <div className="space-y-3 text-sm">
          {ls?.departure_airport && (
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-400">Kalkış</span>
              <span className="font-medium text-gray-900">{ls.departure_airport}</span>
            </div>
          )}
          {ls?.arrival_airport && (
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-400">Varış</span>
              <span className="font-medium text-gray-900">{ls.arrival_airport}</span>
            </div>
          )}
          {ls?.estimated_arrival && (
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-400">Tahmini Varış</span>
              <span className="font-medium text-gray-900">
                {new Date(ls.estimated_arrival).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Planlanan Alış</span>
            <span className="font-medium text-gray-900">
              {new Date(data.scheduled_pickup).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-300 text-center mt-6">Bu sayfa TransferAlert tarafından otomatik güncellenir.</p>
      </div>
    </div>
  );
}
