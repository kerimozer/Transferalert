import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Plane, CheckCircle, XCircle, Clock, Bell } from 'lucide-react';

export default function ReportsPage() {
  const [reservations,  setReservations]  = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([api.listReservations(), api.listNotifications()])
      .then(([r, n]) => { setReservations(r || []); setNotifications(n || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-400">Yükleniyor...</div>;

  const total     = reservations.length;
  const completed = reservations.filter(r => r.status === 'completed').length;
  const cancelled = reservations.filter(r => r.status === 'cancelled').length;
  const active    = reservations.filter(r => r.status === 'active').length;
  const sentSms   = notifications.filter(n => n.status === 'sent').length;

  // Son 30 günün günlük dağılımı
  const last30 = getLast30Days(reservations);

  // En çok takip edilen uçuşlar
  const topFlights = getTopFlights(reservations);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Raporlar</h1>
      <p className="text-sm text-gray-400 mb-8">Genel performans ve istatistikler.</p>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Plane}       color="blue"  label="Toplam Uçuş"    value={total} />
        <StatCard icon={CheckCircle} color="green" label="Tamamlanan"      value={completed} />
        <StatCard icon={XCircle}     color="red"   label="İptal"           value={cancelled} />
        <StatCard icon={Bell}        color="purple" label="Bildirim Gönderildi" value={sentSms} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Son 30 Gün */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> Son 30 Gün
          </h2>
          <div className="space-y-2">
            {last30.slice(-10).map(({ date, count }) => (
              <div key={date} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">{date}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(count / Math.max(...last30.map(d => d.count), 1) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 w-4">{count}</span>
              </div>
            ))}
            {last30.every(d => d.count === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>

        {/* En Çok Takip */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plane size={16} className="text-blue-500" /> En Çok Takip Edilen
          </h2>
          {topFlights.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz veri yok</p>
          ) : (
            <div className="space-y-3">
              {topFlights.map(({ flight, count }) => (
                <div key={flight} className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-gray-800">{flight}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${count / topFlights[0].count * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">{count}x</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tamamlanma Oranı */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tamamlanma Oranı</h2>
          {total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz veri yok</p>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-gray-900">{Math.round(completed / total * 100)}%</span>
                <span className="text-sm text-gray-400 mb-1">tamamlama</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: `${completed / total * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{completed} tamamlandı</span>
                <span>{cancelled} iptal</span>
                <span>{active} aktif</span>
              </div>
            </>
          )}
        </div>

        {/* Bildirim Başarı Oranı */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Bildirim Başarı Oranı</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz bildirim yok</p>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-gray-900">
                  {Math.round(sentSms / notifications.length * 100)}%
                </span>
                <span className="text-sm text-gray-400 mb-1">başarı</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${sentSms / notifications.length * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{sentSms} gönderildi</span>
                <span>{notifications.length - sentSms} başarısız</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function getLast30Days(reservations) {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd   = dayStart + 86400000;
    const count = reservations.filter(r => {
      const t = new Date(r.created_at).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    days.push({ date: dateStr, count });
  }
  return days;
}

function getTopFlights(reservations) {
  const counts = {};
  for (const r of reservations) {
    counts[r.flight_number] = (counts[r.flight_number] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([flight, count]) => ({ flight, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}
