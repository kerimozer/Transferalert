// Gece nöbeti tahtası (web) — mobil `NightWatchScreen`in ikizi.
//
// ÇÖZDÜĞÜ SORUN: nöbet ekranı YALNIZ mobilde vardı. Nöbetçiye bildirim
// gidiyor ama masabaşındaysa açabileceği hiçbir ekran yoktu — telefonu
// almadan işi göremiyordu. Dispatcher'ların çoğu geceyi bilgisayar başında
// geçiriyor; ürünün "nöbet" vaadi web'de karşılıksızdı.
//
// Ekranın sorduğu üç soru, gece bu sırayla sorulur:
//   1) Şu an sahada ne var?      → liste, en yakın alış en üstte
//   2) Bu işin şoförü var mı?    → atanmamış iş kartın başında UYARI rozetiyle
//   3) Kimi arayacağım?          → yolcu ve şoför için tek tıkla arama
//
// Yetki SÜRELİDİR: pencere dışında sunucu 403 döner ve burada bilgi ekranı
// gösterilir. İstemci "nöbetteyim" kararını KENDİ vermez (sunucu söyler) —
// aksi halde saati yanlış olan bir bilgisayar firmanın işlerini açardı.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, RefreshCw, AlertCircle, Phone, MapPin, User, FileText, Tag, Hourglass, Navigation, Car, ChevronDown, ChevronUp, X } from 'lucide-react';
import { api } from '../lib/api';
import { transferLabel, isFlightTransfer, hasDriver, initials } from '../lib/transfer';
import { jobBadge } from '../lib/status';
import { StatusStrip, Badge, EmptyState, LoadingBlock, Button } from '../components/ui';

// "22:00:00" → "22:00" (PostgREST `time` kolonunu saniyeli döndürür).
const shortTime = (v) => (typeof v === 'string' ? v.slice(0, 5) : '');

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1">
      <Icon size={15} className="text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-ink-muted">{label}</p>
        <p className="text-sm text-ink break-words">{value}</p>
      </div>
    </div>
  );
}

// Nöbet dışı / nöbetçi değil — HATA DEĞİL, ekranın ikinci normal durumu.
// Kırmızı bir hata kutusu göstermek nöbetçiye "sistem bozuk" dedirtirdi.
function OffDuty({ title, text, onRetry }) {
  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="bg-surface border border-surface-border rounded-card shadow-card p-8 max-w-sm text-center">
        <Moon size={40} className="text-brand-600 mx-auto mb-3" aria-hidden="true" />
        <p className="font-semibold text-ink">{title}</p>
        {text && <p className="text-sm text-ink-muted mt-1">{text}</p>}
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={onRetry} icon={RefreshCw}>Yenile</Button>
        </div>
      </div>
    </div>
  );
}

function WatchCard({ res, onOpen }) {
  const [open, setOpen] = useState(false);
  // Şoför kimliği ÜYELİK satırıdır; hesabı olmayan (taşeron) şoför de atanmış
  // sayılır. Ortak tanım (`lib/transfer.js`) — mobil ikizinde de aynısı.
  // `needsDriver()` KULLANILMAZ: o yalnız `active` işte alarm üretir, tahta
  // ise `pending` işleri de gösterir ve şoförsüz bir `pending` iş gece tam
  // olarak görülmesi gerekendir.
  const driverAssigned = hasDriver(res);
  const pending = res.status === 'pending';
  const stage = jobBadge(res);

  return (
    <div className={`bg-surface border rounded-card shadow-card overflow-hidden ${
      driverAssigned ? 'border-surface-border' : 'border-bad-600 border-l-4'
    }`}>
      {/* DURUM ŞERİDİ — ortak bileşen. Gece tahtası özellikle kazanıyor:
          nöbet penceresi gece yarısını aştığı için tahtada İKİ FARKLI GÜNE
          ait işler yan yana duruyor ve saat tek başına hangisinin bu geceye
          ait olduğunu söylemiyor. */}
      <StatusStrip r={res} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-alt transition-colors"
      >
        <span className="w-9 h-9 rounded-full bg-surface-alt flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-ink-soft">{initials(res.passenger_name)}</span>
        </span>
        <span className="flex-1 min-w-0">
          {/* `transferLabel` — uçuş no ÖNCE. Nöbetçi gece bu tahtaya bakıp
              hangi uçuşun indiğini eşleştiriyor. Uçuşsuzda ada düşer.
              Saat ŞERİTTE: burada tekrarlanmaz. */}
          <span className="block font-bold text-ink truncate">{transferLabel(res)}</span>
          <span className="block text-xs text-ink-muted truncate">
            {isFlightTransfer(res) ? res.passenger_name : 'Transfer'}
          </span>
        </span>
        {/* AÇILABİLİRLİK GÖRSEL OLARAK DA İŞARETLİ. `aria-expanded` ekran
            okuyucuya söylüyordu ama GÖREN kullanıcıya hiçbir şey söylemiyordu —
            mobil ikizinde chevron vardı, burada yoktu. */}
        {open
          ? <ChevronUp size={18} className="text-ink-muted shrink-0" aria-hidden="true" />
          : <ChevronDown size={18} className="text-ink-muted shrink-0" aria-hidden="true" />}
      </button>

      {/* Rozet şeridi: gecenin en kritik iki sinyali. Anlam yalnız renkle
          verilmiyor — ikon + metin eşlik ediyor (erişilebilirlik). */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
        {driverAssigned ? (
          <Badge cls="bg-surface-alt text-ink-soft"><User size={12} /> {res.driver_name || 'Şoför atandı'}</Badge>
        ) : (
          <Badge cls="bg-bad-50 text-bad-800"><AlertCircle size={12} /> Şoför atanmadı</Badge>
        )}
        {pending && <Badge cls="bg-warn-50 text-warn-800"><Hourglass size={12} /> Onay bekliyor</Badge>}
        {stage && <Badge cls="bg-brand-50 text-brand-700"><Navigation size={12} /> {stage.label}</Badge>}
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-surface-border pt-3">
          {res.meeting_point && (
            <div className="mb-2 rounded-control bg-surface-alt px-3 py-2">
              <p className="text-[11px] font-semibold text-ink-muted">Buluşma Noktası</p>
              <p className="text-sm font-semibold text-ink break-words">{res.meeting_point}</p>
            </div>
          )}
          <InfoRow icon={MapPin}   label="Varış"  value={res.dropoff_point} />
          {/* PLAKA — mobil ikizinde vardı, burada YOKTU. Yolcu "beni hangi
              araç alacak?" diye arayınca telefondaki nöbetçi cevap verip
              bilgisayardakinin veremediği bir alan olmamalı (migration 030). */}
          <InfoRow icon={Car}      label="Araç"   value={res.vehicle_plate} />
          <InfoRow icon={User}     label="Şoför"  value={res.driver_name} />
          <InfoRow icon={FileText} label="Not"    value={res.notes} />
          <InfoRow icon={Tag}      label="PNR"    value={res.pnr} />

          {/* TELEFON `tel:` İLE AÇILIR — masaüstünde çoğu tarayıcı bunu bir
              uygulamaya devreder, devretmezse hiçbir şey olmaz. O yüzden
              numara METİN olarak da basılır: nöbetçi her hâlükârda okuyup
              elindeki telefondan arayabilsin. Mobilde bu gerekmiyordu. */}
          <div className="mt-3 flex flex-wrap gap-2">
            {res.passenger_phone && (
              <a href={`tel:${res.passenger_phone}`}
                 className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-600/25 rounded-control px-3 py-2 transition-colors">
                <Phone size={14} /> Yolcu: {res.passenger_phone}
              </a>
            )}
            {res.driver_phone && (
              <a href={`tel:${res.driver_phone}`}
                 className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-600/25 rounded-control px-3 py-2 transition-colors">
                <Phone size={14} /> Şoför: {res.driver_phone}
              </a>
            )}
            {res.meeting_point && (
              <button
                type="button"
                onClick={() => onOpen(res.meeting_point)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:bg-surface-alt rounded-control px-3 py-2 transition-colors">
                <Navigation size={14} /> Haritada aç
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NightWatchPage() {
  const [board, setBoard] = useState(null);      // { reservations, org, window }
  const [offInfo, setOff] = useState(null);      // { assigned, window }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // EYLEM hatası YÜKLEME hatasından AYRI — mobil ikizindeki kural.
  // Aynı kutuya konsaydı: harita açılmadığında "Nöbet tahtası yüklenemedi —
  // Harita açılamadı" tam ekranı basılabiliyordu (tahta 403 ile boşaldığı an
  // eylem hatası yazılırsa render o dala düşer). Yanlış teşhis, yanlış ekran.
  const [actionError, setActionError] = useState('');
  // Son BAŞARILI okuma. "Tahtada iş yok" ile "tahtayı iki saattir okumadım"
  // ekranda birebir aynı görünmemeli — bu ekran gece, kimsenin doğrulamadığı
  // saatte çalışıyor.
  const [lastOk, setLastOk] = useState(null);
  const [busy, setBusy] = useState(false);
  const errorRef = useRef(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setBoard(await api.nightWatchBoard());
      setOff(null);
      setLoadError('');
      setLastOk(new Date());
    } catch (e) {
      // 403 = nöbet dışı; HATA DEĞİL, ekranın ikinci normal durumu.
      // Sunucu gövdeye `on_duty` koyuyor (api.js onu hataya iliştirir).
      if (e.offDuty) { setOff(e.offDuty); setBoard(null); setLoadError(''); }
      else setLoadError(e?.message || String(e));
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // TAHTA KENDİNİ TAZELER. Nöbetçi 23:00'te sekmeyi açıp bırakıyor; 01:30'da
  // yeni bir rezervasyon giriliyor ve bir şoför aşama ilerletiyor. Tazelenmeyen
  // bir ekran 23:00'ün dünyasını göstermeye devam eder ve bunu söyleyen hiçbir
  // işaret olmaz. Aynı reçete `DriverPortalPage` ve `TrackPage`te de var.
  //
  // YALNIZ GÖRÜNÜRKEN: arka plandaki sekme bütün gece boşuna istek atmasın.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') load(); };
    const timer = setInterval(tick, 90000);
    // Sekmeye dönüldüğünde beklemeden tazele.
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [load]);

  // Harita YENİ SEKMEDE açılır ve başarısızlığı EKRANA basılır.
  // `window.open` açılır pencere engelleyicisine takılabilir ve `null` döner —
  // o hâlde hiçbir şey olmaz ve nöbetçi "tıkladım, tepki vermedi" der.
  const onOpen = useCallback((q) => {
    const w = window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
      '_blank', 'noopener,noreferrer',
    );
    if (!w) {
      setActionError('Harita açılamadı — tarayıcınız açılır pencereyi engellemiş olabilir.');
      errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, []);

  if (loading) return <div className="p-8 max-w-3xl"><LoadingBlock /></div>;

  if (loadError && !board) {
    return (
      <div className="p-8 max-w-3xl">
        <OffDuty title="Nöbet tahtası yüklenemedi" text={loadError} onRetry={load} />
      </div>
    );
  }

  if (offInfo) {
    const w = offInfo.window;
    return (
      <div className="p-8 max-w-3xl">
        <OffDuty
          title={offInfo.assigned ? 'Nöbetiniz şu an başlamadı' : 'Gece nöbetçisi değilsiniz'}
          text={offInfo.assigned && w?.start
            ? `Nöbet saatleri: ${shortTime(w.start)} – ${shortTime(w.end)}`
            : 'Firma yöneticiniz sizi nöbetçi seçtiğinde gecenin transferleri burada görünür.'}
          onRetry={load}
        />
      </div>
    );
  }

  const list = board?.reservations || [];
  // ŞERİT SAYACI DA ORTAK TANIMI KULLANIR (`hasDriver`). Satır-içi bir kopya,
  // kart "Şoför atanmadı" derken üstteki özetin "0" göstermesine yol açardı —
  // mobilde tam olarak bu yaşandı.
  const missing = list.filter((r) => !hasDriver(r)).length;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Gece Nöbeti</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Bu gecenin canlı transferleri. Nöbet penceresi kapanınca erişim de kapanır.
          </p>
        </div>
        {/* BUTON UÇUŞ SIRASINDA İZ BIRAKIR. Sessizken: nöbetçi 03:00'te basar,
            ağ yavaştır, ekranda hiçbir şey değişmez, üst üste basar ve şikâyet
            "Yenile tepki vermiyor" olur. `Button` zaten spinner + aria-busy
            veriyor. */}
        <Button variant="secondary" onClick={load} icon={RefreshCw} loading={busy}>Yenile</Button>
      </div>

      {/* TAZELEME HATASI ÇALIŞAN TAHTAYI BOZMAZ: elde veri varken şerit
          listenin üstünde durur, liste basılmaya devam eder. Gece 03:00'te
          tek bir başarısız istek yüzünden tahtayı elinden almak, arızayı
          büyütmek olurdu. */}
      {loadError && board && (
        <div ref={errorRef} role="alert" className="mb-4 flex items-start gap-2 rounded-card bg-bad-50 px-4 py-3">
          <AlertCircle size={16} className="text-bad-800 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="flex-1 text-sm text-bad-800 break-words">
            <span className="font-semibold">Tahta güncellenemedi.</span>{' '}
            <span className="break-words">{loadError}</span>{' '}
            Aşağıdaki liste son başarılı okumadan kalma.
          </p>
          <button type="button" onClick={() => setLoadError('')} aria-label="Hatayı kapat"
            className="shrink-0 text-bad-800 hover:bg-bad-600/15 rounded-control p-1.5">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* EYLEM hatası AYRI kutuda: "tahtayı okuyamadım" ile "harita açılmadı"
          bambaşka iki arıza ve nöbetçinin alacağı aksiyon da farklı. */}
      {actionError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-card bg-bad-50 px-4 py-3">
          <AlertCircle size={16} className="text-bad-800 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="flex-1 text-sm text-bad-800 break-words">{actionError}</p>
          <button type="button" onClick={() => setActionError('')} aria-label="Hatayı kapat"
            className="shrink-0 text-bad-800 hover:bg-bad-600/15 rounded-control p-1.5">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Nöbet şeridi: hangi firma adına, hangi saatler arası. Nöbetçi çoğu
          zaman uykudan uyanmış biri — "ben neye bakıyorum" sorusu ekranda
          yazılı olmalı. */}
      <div className="flex items-center gap-2 flex-wrap mb-4 rounded-card bg-brand-50 px-4 py-2.5">
        <Moon size={15} className="text-brand-700 shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold text-brand-700 truncate">
          {board?.org?.name || ''}
          {board?.window?.start ? ` · ${shortTime(board.window.start)}–${shortTime(board.window.end)}` : ''}
        </span>
        {missing > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-bad-800 bg-bad-50 rounded-full px-2 py-1">
            <AlertCircle size={12} aria-hidden="true" /> {missing} işte şoför yok
          </span>
        )}
        {/* TAZELİK DAMGASI — "tahtada iş yok" ile "tahtayı iki saattir
            okumadım"ı ayıran tek işaret. Sayfa 90 saniyede bir kendini
            tazeliyor ama bu, tazelemenin ÇALIŞTIĞINI gösteren kanıt. */}
        {lastOk && (
          <span className="ml-auto text-xs text-brand-700 tabular-nums shrink-0">
            Son güncelleme {lastOk.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* HATA VARKEN BOŞ DURUM BASILMAZ. "Nöbette bekleyen iş yok" ile
          "tahtayı okuyamadım" aynı ekranı üretirse nöbetçi gece sahada iş
          olmadığını sanar ve uyur — bu ekranın var olma sebebinin tam
          tersi. Şerit zaten yukarıda; burada sessiz kalmak yeterli. */}
      {list.length === 0 ? (
        loadError ? null : (
          <EmptyState
            icon={Moon}
            title="Nöbette bekleyen iş yok"
            description="Firmanın bu geceye ait canlı transferleri burada listelenir."
          />
        )
      ) : (
        <div className="space-y-3">
          {list.map((r) => <WatchCard key={r.id} res={r} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}
