import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Plane, CheckCircle, XCircle, Clock, Bell, AlertTriangle } from 'lucide-react';
import { EmptyState, LoadingBlock } from '../components/ui';
import { isSent, notifyKey } from '../lib/notify';

export default function ReportsPage() {
  const [reservations,  setReservations]  = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState(null);

  // HATA YUTULMAZ. `.catch` YOKTU ve bu sayfada sonuç daha da yanıltıcıydı:
  // istek düşünce her sayaç SIFIR basıyordu — "0 transfer · 0 gönderildi ·
  // %0 başarı". Yani okunamayan bir veri, "hiç iş yapılmadı" diye RAPORLANIYOR
  // ve firma sahibi bunu gerçek bir rapor sanıyordu.
  //
  // `Promise.all` ayrıca HEPSİNİ birden düşürür: tek bir uç 429 alsa diğerinin
  // verisi de atılır. Bu yüzden ikisi AYRI AYRI karşılanıyor — biri gelirse o
  // gösterilir, gelmeyen için uyarı basılır.
  useEffect(() => {
    Promise.allSettled([api.listReservations(), api.listNotifications()])
      .then(([r, n]) => {
        if (r.status === 'fulfilled') setReservations(r.value || []);
        if (n.status === 'fulfilled') setNotifications(n.value || []);
        const errs = [r, n].filter(x => x.status === 'rejected')
          .map(x => x.reason?.message || String(x.reason));
        setLoadError(errs.length ? errs.join(' · ') : null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><LoadingBlock /></div>;

  const total     = reservations.length;
  const completed = reservations.filter(r => r.status === 'completed').length;
  const cancelled = reservations.filter(r => r.status === 'cancelled').length;
  const active    = reservations.filter(r => r.status === 'active').length;
  // Ölçüt lib/notify.js'te — aynı soru dört ekranda soruluyor ve kopyalar
  // ayrışırsa sayaçlar birbirini tutmaz.
  const sentSms   = notifications.filter(isSent).length;
  // "Başarısız" ile "denenmedi" AYRI sayılır (migration 031). Eskiden burada
  // `toplam - gönderilen` yazıyordu; yapılandırılmamış bir kanalın hiç
  // denenmemiş satırlarını "başarısız" diye raporluyordu ve firma sahibine
  // olmayan bir arıza gösteriyordu.
  const failedSms  = notifications.filter(n => notifyKey(n.status) === 'failed').length;
  const skippedSms = notifications.filter(n => notifyKey(n.status) === 'skipped').length;

  // Son 30 günün günlük dağılımı
  const last30 = getLast30Days(reservations);

  // En çok takip edilen uçuşlar
  const topFlights = getTopFlights(reservations);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Raporlar</h1>
      <p className="text-sm text-ink-muted mb-8">Genel performans ve istatistikler.</p>

      {/* HATA ŞERİDİ bu sayfada özellikle ŞART: veri okunamadığında sayaçlar
          sıfır basar ve "hiç iş yapılmadı" gibi görünür. Sessiz kalırsa firma
          sahibi boş bir raporu gerçek sanır — sayı yanlış olduğunda bile
          kendinden emin görünür. */}
      {loadError && (
        <div className="mb-6 flex items-start gap-2 rounded-card bg-bad-50 px-4 py-3">
          <AlertTriangle size={16} className="text-bad-800 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-bad-800">
            <span className="font-semibold">Veriler eksik yüklendi — aşağıdaki sayılar tam değil.</span>{' '}
            <span className="break-words">{loadError}</span>
          </p>
        </div>
      )}

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Plane}       color="blue"  label="Toplam Uçuş"    value={total} />
        <StatCard icon={CheckCircle} color="green" label="Tamamlanan"      value={completed} />
        <StatCard icon={XCircle}     color="red"   label="İptal"           value={cancelled} />
        <StatCard icon={Bell}        color="purple" label="Bildirim Gönderildi" value={sentSms} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Son 30 Gün */}
        <div className="bg-surface border border-surface-border rounded-card p-6">
          <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-600" /> Son 30 Gün
          </h2>
          <div className="space-y-2">
            {last30.slice(-10).map(({ date, count }) => (
              <div key={date} className="flex items-center gap-3">
                <span className="text-xs text-ink-muted w-20 shrink-0">{date}</span>
                <div className="flex-1 bg-surface-alt rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full"
                    style={{ width: `${Math.min(count / Math.max(...last30.map(d => d.count), 1) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-ink-soft w-4">{count}</span>
              </div>
            ))}
            {last30.every(d => d.count === 0) && !loadError && (
              <EmptyState size="sm" title="Henüz veri yok" />
            )}
          </div>
        </div>

        {/* En Çok Takip */}
        <div className="bg-surface border border-surface-border rounded-card p-6">
          <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <Plane size={16} className="text-brand-600" /> En Çok Takip Edilen
          </h2>
          {topFlights.length === 0 ? (loadError ? null : 
            <EmptyState size="sm" title="Henüz veri yok" />
          ) : (
            <div className="space-y-3">
              {topFlights.map(({ flight, count }) => (
                <div key={flight} className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-ink">{flight}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-surface-alt rounded-full h-1.5">
                      <div
                        className="bg-brand-600 h-1.5 rounded-full"
                        style={{ width: `${count / topFlights[0].count * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-muted w-6 text-right">{count}x</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tamamlanma Oranı */}
        <div className="bg-surface border border-surface-border rounded-card p-6">
          <h2 className="font-semibold text-ink mb-4">Tamamlanma Oranı</h2>
          {total === 0 ? (loadError ? null : 
            <EmptyState size="sm" title="Henüz veri yok" />
          ) : (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-ink">{Math.round(completed / total * 100)}%</span>
                <span className="text-sm text-ink-muted mb-1">tamamlama</span>
              </div>
              <div className="w-full bg-surface-alt rounded-full h-3">
                <div className="bg-ok-600 h-3 rounded-full" style={{ width: `${completed / total * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-ink-muted">
                <span>{completed} tamamlandı</span>
                <span>{cancelled} iptal</span>
                <span>{active} aktif</span>
              </div>
            </>
          )}
        </div>

        {/* Bildirim Başarı Oranı */}
        <div className="bg-surface border border-surface-border rounded-card p-6">
          <h2 className="font-semibold text-ink mb-4">Bildirim Başarı Oranı</h2>
          {notifications.length === 0 ? (loadError ? null : 
            <EmptyState size="sm" title="Henüz bildirim yok" />
          ) : (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-ink">
                  {Math.round(sentSms / notifications.length * 100)}%
                </span>
                <span className="text-sm text-ink-muted mb-1">başarı</span>
              </div>
              <div className="w-full bg-surface-alt rounded-full h-3">
                <div className="bg-brand-600 h-3 rounded-full" style={{ width: `${sentSms / notifications.length * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-ink-muted">
                <span>{sentSms} gönderildi</span>
                <span>
                  {failedSms} başarısız
                  {skippedSms > 0 && ` · ${skippedSms} denenmedi`}
                </span>
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
    blue:   'bg-brand-50 text-brand-600',
    green:  'bg-ok-50 text-ok-600',
    red:    'bg-bad-50 text-bad-800',
    purple: 'bg-accent-50 text-accent-600',
  };
  return (
    <div className="bg-surface border border-surface-border rounded-card p-5">
      <div className={`w-9 h-9 rounded-card flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-sm text-ink-muted mt-0.5">{label}</p>
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

// "En çok tekrar eden uçuşlar" — SORU UÇUŞLA İLGİLİ, dolayısıyla uçuşsuz
// transferler bu tabloya girmez. Girselerdi hepsi tek bir `null` kovasında
// toplanıp listenin başına oturur ve raporu okunamaz hale getirirdi.
function getTopFlights(reservations) {
  const counts = {};
  for (const r of reservations) {
    if (!r.flight_number) continue;
    counts[r.flight_number] = (counts[r.flight_number] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([flight, count]) => ({ flight, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}
