// Yolcunun gördüğü sayfa — girişsiz, link WhatsApp'ta elden ele dolaşır.
//
// 2026-08-28: sayfa yalnız UÇUŞUN durumunu gösteriyordu; şoförün yola çıkıp
// çıkmadığını söylemiyordu. Oysa `job_status` + `job_status_at` (migration 023)
// veritabanında zaten doluydu ve şoför her aşamada basıyordu. Yolcunun asıl
// sorusu "uçuş nerede" değil, "şoförüm yola çıktı mı, ne zaman gelecek" —
// harita olmadan, GPS olmadan, izin olmadan cevaplanabilir.
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plane, Car, CheckCircle, XCircle, Clock, AlertTriangle, Check } from 'lucide-react';
import { formatPickup } from '../lib/format';
import { isFlightTransfer, transferLabel, typeKey, TYPE_AIRPORT } from '../lib/transfer';
import { JOB_LABELS } from '../lib/status';
import { trackLang, RTL, tUi, tFlight, tStage } from '../lib/trackI18n';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Aşama sırası TEK KAYNAKTAN türetilir. Elle yazılmış bir dizi olarak duruyordu
// ve hiçbir kapı onu görmüyordu ([3] obje literallerine bakar, diziye kör):
// backend'e 5. bir aşama eklendiğinde JOB_LABELS ve trackI18n kapılarla
// zorlanır, bu dizi 4'te kalırdı → `reached` -1 döner, yolcu sayfası şoför
// yoldayken "Şoför henüz yola çıkmadı" basardı.
const STAGES = Object.keys(JOB_LABELS);

const FLIGHT_ICON = {
  landed: CheckCircle, cancelled: XCircle, active: Plane,
  scheduled: Clock, diverted: AlertTriangle,
};
const FLIGHT_CLS = {
  landed:    'text-ok-800 bg-ok-50',
  cancelled: 'text-bad-800 bg-bad-50',
  active:    'text-brand-700 bg-brand-50',
  scheduled: 'text-ink-soft bg-surface-alt',
  diverted:  'text-warn-800 bg-warn-50',
};

export default function TrackPage() {
  const { token } = useParams();
  const [data, setData]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  const [staleAt, setStaleAt] = useState(null);

  // İLK YÜKLEME İLE TAZELEME AYRI YOLLARDIR.
  //
  // Sayfa 60 saniyede bir kendini tazeliyor. Hata yolu ayrılmasaydı TEK bir
  // başarısız istek (telefon şebeke değiştirir, Railway yeniden başlar, oran
  // sınırı 429 döner) çalışan bir sayfayı "Takip linki bulunamadı veya
  // geçersiz." ekranına çevirirdi: yolcu linkin öldüğünü sanıp firmayı arar,
  // 60 sn sonra kendiliğinden düzeldiği için de kimse sebebini bulamaz.
  // Veri elimizdeyse onu KORU, yalnız tazelenemediğini söyle.
  const load = useCallback(async (isRefresh = false) => {
    try {
      const res = await fetch(`${API}/api/public/track/${token}`);
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setError('');
      setStaleAt(null);
    } catch (e) {
      if (isRefresh) setStaleAt(new Date());
      else setError('notFound');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Yolcu bu sayfayı açık bırakır ve şoför ilerledikçe güncellenmesini bekler.
  // 60 sn'de bir tazele — ama sekme GÖRÜNÜR değilken durdur: arka planda
  // unutulmuş bir sekme günlerce boşuna istek atardı.
  useEffect(() => {
    let id = null;
    const refresh = () => load(true);
    const start = () => { if (id === null) id = setInterval(refresh, 60000); };
    const stop  = () => { if (id !== null) { clearInterval(id); id = null; } };
    const onVis = () => (document.hidden ? stop() : (refresh(), start()));
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [load]);

  const lang = trackLang(data?.passenger_lang);
  const dir  = RTL.has(lang) ? 'rtl' : 'ltr';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-ink-muted text-sm">
      {tUi('tr', 'loading')}
    </div>
  );

  // Hata ekranı YALNIZ elimizde hiç veri yokken. Veri varsa sayfa durur,
  // tazelenemediği aşağıda küçük bir izle söylenir.
  if (error && !data) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-surface border border-surface-border rounded-card shadow-card p-8 max-w-sm text-center">
        <XCircle size={30} className="text-bad-600 mx-auto mb-3" aria-hidden="true" />
        <p className="text-ink-soft font-semibold">{tUi('tr', 'notFound')}</p>
      </div>
    </div>
  );

  const ls = data.latest_status;
  const flightStatus = ls?.flight_status || 'scheduled';
  const isP2P = !isFlightTransfer(data);
  const cancelled = data.status === 'cancelled';
  const stamps = data.job_status_at || {};
  // Çizelge yalnız backend gönderdiyse çizilir — iptal edilmiş ya da 24 saati
  // geçmiş işte uç `job_status_at` alanını HİÇ döndürmez.
  const hasTimeline = 'job_status_at' in data;
  const reached = STAGES.findIndex(s => s === data.job_status);

  // Şerit: canlı uçuş verisi varsa DURUMU, yoksa TÜRÜ söyler.
  const stripIsStatus = !!ls;
  const StripIcon = stripIsStatus
    ? (FLIGHT_ICON[flightStatus] || Clock)
    : (typeKey(data) === TYPE_AIRPORT ? Plane : Car);
  const stripCls = stripIsStatus ? (FLIGHT_CLS[flightStatus] || FLIGHT_CLS.scheduled) : 'text-ink-soft bg-surface-alt';
  const stripLabel = stripIsStatus
    ? tFlight(lang, flightStatus)
    : tUi(lang, typeKey(data) === TYPE_AIRPORT ? 'typeAirport' : 'typeTransfer');

  return (
    <div dir={dir} lang={lang} className="min-h-screen flex items-start justify-center bg-surface-bg p-4 py-8">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="bg-brand-600 text-onfill p-1.5 rounded-control"><Plane size={15} aria-hidden="true" /></div>
          <span className="font-bold text-ink">TransferAlert</span>
        </div>

        <div className="bg-surface border border-surface-border rounded-card shadow-card overflow-hidden">
          <div className={`flex items-center gap-2 px-4 py-2.5 ${stripCls}`}>
            <StripIcon size={15} aria-hidden="true" className="shrink-0" />
            <span className="text-xs font-bold truncate">{stripLabel}</span>
            {ls?.arrival_delay > 0 && (
              <span className="text-xs font-medium text-warn-800 whitespace-nowrap">
                +{ls.arrival_delay} {tUi(lang, 'delay')}
              </span>
            )}
            <span className="grow" />
            <span dir="ltr" className="text-sm font-bold tabular-nums whitespace-nowrap shrink-0">
              {formatPickup(data.scheduled_pickup)}
            </span>
          </div>

          <div className="px-5 pt-4 pb-4">
            {/* Etiket TEK KAYNAKTAN (`transferLabel`): yolcu bu sayfada KENDİ
                uçuşunu arar, uçuşlu kayıtta numara başlıktır. Elle yazılan
                `flight_number || passenger_name` kopyası, yardımcının üçüncü
                yedeğini (bozuk satırda 'Transfer') taşımıyordu ve başlık boş
                kalabiliyordu. */}
            <p className={`font-bold text-2xl text-ink leading-tight ${isFlightTransfer(data) ? 'font-mono' : ''}`}>
              {transferLabel(data)}
            </p>
            {/* YOLCUNUN TAM ADI BASILMAZ. Bu sayfa girişsizdir ve link
                WhatsApp'ta elden ele dolaşır — ad da beraberinde yayılır.
                Aynı sayfada ŞOFÖRÜN adı gizlilik için kısaltılıyor
                ("Kerim Ö."); yolcuya daha gevşek bir standart uygulamak
                tutarsız olurdu. Yolcu zaten kim olduğunu biliyor. */}
          </div>

          {cancelled ? (
            <div className="px-5 py-4 bg-bad-50 border-t border-surface-border flex items-center gap-2">
              <XCircle size={16} className="text-bad-800 shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-bad-800">{tUi(lang, 'cancelled')}</span>
            </div>
          ) : hasTimeline ? (
            <div className="px-5 py-4 border-t border-surface-border">
              {reached < 0 ? (
                <p className="text-sm text-ink-muted">{tUi(lang, 'notStarted')}</p>
              ) : (
                <ol className="space-y-0">
                  {STAGES.map((stage, i) => {
                    const done = i <= reached;
                    const at = stamps[stage];
                    return (
                      <li key={stage} className="flex items-start gap-3 min-h-[38px]">
                        <div className="flex flex-col items-center shrink-0 self-stretch">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            done ? 'bg-ok-50 text-ok-800' : 'bg-surface-alt text-ink-muted'
                          }`}>
                            {done ? <Check size={12} strokeWidth={3} aria-hidden="true" />
                                  : <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
                          </span>
                          {i < STAGES.length - 1 && (
                            <span className={`w-px grow min-h-[14px] ${done ? 'bg-ok-600/30' : 'bg-surface-border'}`} aria-hidden="true" />
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 grow pb-3 min-w-0">
                          <span className={`text-sm truncate ${done ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
                            {tStage(lang, stage, isP2P)}
                          </span>
                          <span className="grow" />
                          {/* Atlanan aşamaya UYDURMA saat yazma: şoför
                              en_route'a basmadan at_airport'a geçebilir
                              (ileri-yönlü kural atlamaya izin verir). */}
                          <span dir="ltr" className="text-xs tabular-nums text-ink-muted shrink-0">
                            {at ? new Date(at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              {(data.driver_name || data.vehicle_plate) && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 pt-3 border-t border-surface-border">
                  {data.driver_name && (
                    <div>
                      <span className="block text-xs text-ink-muted">{tUi(lang, 'driver')}</span>
                      <span className="text-sm font-semibold text-ink">{data.driver_name}</span>
                    </div>
                  )}
                  {data.vehicle_plate && (
                    <div>
                      <span className="block text-xs text-ink-muted">{tUi(lang, 'plate')}</span>
                      <span dir="ltr" className="text-sm font-semibold text-ink tabular-nums">{data.vehicle_plate}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {(ls?.departure_airport || ls?.arrival_airport || ls?.estimated_arrival) && (
            <div className="px-5 py-4 border-t border-surface-border space-y-2 text-sm">
              {ls?.departure_airport && (
                <div className="flex justify-between gap-4">
                  <span className="text-ink-muted">{tUi(lang, 'departure')}</span>
                  <span className="font-semibold text-ink">{ls.departure_airport}</span>
                </div>
              )}
              {ls?.arrival_airport && (
                <div className="flex justify-between gap-4">
                  <span className="text-ink-muted">{tUi(lang, 'arrival')}</span>
                  <span className="font-semibold text-ink">{ls.arrival_airport}</span>
                </div>
              )}
              {ls?.estimated_arrival && (
                <div className="flex justify-between gap-4">
                  <span className="text-ink-muted">{tUi(lang, 'eta')}</span>
                  <span dir="ltr" className="font-semibold text-ink tabular-nums">{formatPickup(ls.estimated_arrival)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-ink-muted text-center mt-5">
          {staleAt
            ? `${tUi(lang, 'stale')} ${staleAt.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}`
            : tUi(lang, 'auto')}
        </p>
      </div>
    </div>
  );
}
